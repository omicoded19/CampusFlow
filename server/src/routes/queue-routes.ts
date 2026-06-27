import {
  Router,
  type Request,
  type Response,
} from "express";

import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/require-auth";

const queueRouter = Router();

const activeStatuses = [
  "WAITING",
  "CALLED",
  "SERVING",
] as const;

const queueEntrySelect = {
  id: true,
  tokenLabel: true,
  status: true,
  reason: true,
  note: true,
  joinedAt: true,
  calledAt: true,
  startedAt: true,
  completedAt: true,
  cancelledAt: true,
  service: {
    select: {
      slug: true,
      title: true,
      averageServiceMinutes: true,
      department: {
        select: {
          name: true,
        },
      },
      counters: {
        select: {
          isActive: true,
        },
      },
      queueEntries: {
        where: {
          status: {
            in: [...activeStatuses],
          },
        },
        orderBy: {
          joinedAt: "asc" as const,
        },
        select: {
          id: true,
          tokenLabel: true,
          status: true,
          joinedAt: true,
        },
      },
    },
  },
  counter: {
    select: {
      label: true,
    },
  },
} satisfies Prisma.QueueEntrySelect;

type QueueEntryWithMetrics =
  Prisma.QueueEntryGetPayload<{
    select: typeof queueEntrySelect;
  }>;

type RequestBody = Record<string, unknown>;

function readTrimmedString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function startOfTodayUtc() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );
}

function formatQueueEntry(entry: QueueEntryWithMetrics) {
  const activeCounters = entry.service.counters.filter(
    (counter) => counter.isActive,
  ).length;

  const activeQueue = entry.service.queueEntries;
  const entryIndex = activeQueue.findIndex(
    (queueEntry) => queueEntry.id === entry.id,
  );

  const peopleAhead =
    entry.status === "WAITING" && entryIndex >= 0
      ? entryIndex
      : 0;

  const estimatedWait =
    activeCounters > 0
      ? Math.ceil(
          (peopleAhead *
            entry.service.averageServiceMinutes) /
            activeCounters,
        )
      : 0;

  const nowServing = activeQueue.find(
    (queueEntry) =>
      queueEntry.status === "SERVING" ||
      queueEntry.status === "CALLED",
  );

  return {
    id: entry.id,
    tokenLabel: entry.tokenLabel,
    status: entry.status,
    reason: entry.reason,
    note: entry.note,
    peopleAhead,
    estimatedWait,
    nowServingToken: nowServing?.tokenLabel ?? null,
    counterLabel: entry.counter?.label ?? null,
    joinedAt: entry.joinedAt,
    calledAt: entry.calledAt,
    startedAt: entry.startedAt,
    completedAt: entry.completedAt,
    cancelledAt: entry.cancelledAt,
    service: {
      id: entry.service.slug,
      title: entry.service.title,
      department: entry.service.department.name,
    },
  };
}

function sendQueueError(
  response: Response,
  error: unknown,
) {
  console.error("Queue request failed:", error);

  response.status(500).json({
    success: false,
    error: {
      code: "QUEUE_ERROR",
      message:
        "Unable to complete the queue request right now.",
    },
  });
}

queueRouter.use(requireAuth(["STUDENT"]));

queueRouter.get(
  "/me/active",
  async (request: Request, response: Response) => {
    try {
      const { userId } =
        (request as AuthenticatedRequest).auth;

      const activeQueueEntry =
        await prisma.queueEntry.findFirst({
          where: {
            userId,
            status: {
              in: [...activeStatuses],
            },
          },
          orderBy: {
            joinedAt: "desc",
          },
          select: queueEntrySelect,
        });

      response.status(200).json({
        success: true,
        data: {
          queue: activeQueueEntry
            ? formatQueueEntry(activeQueueEntry)
            : null,
        },
      });
    } catch (error) {
      sendQueueError(response, error);
    }
  },
);

queueRouter.get(
  "/me/history",
  async (request: Request, response: Response) => {
    try {
      const { userId } =
        (request as AuthenticatedRequest).auth;

      const entries = await prisma.queueEntry.findMany({
        where: {
          userId,
        },
        orderBy: {
          joinedAt: "desc",
        },
        take: 50,
        select: queueEntrySelect,
      });

      const history = entries.map(formatQueueEntry);
      const completedCount = history.filter(
        (entry) => entry.status === "COMPLETED",
      ).length;

      response.status(200).json({
        success: true,
        data: {
          history,
          completedCount,
        },
      });
    } catch (error) {
      sendQueueError(response, error);
    }
  },
);

queueRouter.post(
  "/",
  async (request: Request, response: Response) => {
    try {
      const { userId } =
        (request as AuthenticatedRequest).auth;
      const body =
        (request.body ?? {}) as RequestBody;

      const serviceId = readTrimmedString(
        body.serviceId,
      );
      const reason = readTrimmedString(body.reason);
      const note = readTrimmedString(body.note);

      if (!serviceId || !reason) {
        response.status(400).json({
          success: false,
          error: {
            code: "MISSING_QUEUE_DETAILS",
            message:
              "A service and reason for the visit are required.",
          },
        });

        return;
      }

      if (note.length > 250) {
        response.status(400).json({
          success: false,
          error: {
            code: "NOTE_TOO_LONG",
            message:
              "The additional note must not exceed 250 characters.",
          },
        });

        return;
      }

      const createdEntry = await prisma.$transaction(
        async (transaction) => {
          const existingActiveEntry =
            await transaction.queueEntry.findFirst({
              where: {
                userId,
                status: {
                  in: [...activeStatuses],
                },
              },
              select: {
                id: true,
              },
            });

          if (existingActiveEntry) {
            throw new Error("ACTIVE_QUEUE_EXISTS");
          }

          const service =
            await transaction.service.findUnique({
              where: {
                slug: serviceId,
              },
              select: {
                id: true,
                tokenPrefix: true,
                isOpen: true,
                reasons: {
                  select: {
                    label: true,
                  },
                },
                counters: {
                  where: {
                    isActive: true,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            });

          if (!service) {
            throw new Error("SERVICE_NOT_FOUND");
          }

          if (
            !service.isOpen ||
            service.counters.length === 0
          ) {
            throw new Error("SERVICE_CLOSED");
          }

          const validReason = service.reasons.some(
            (serviceReason) =>
              serviceReason.label === reason,
          );

          if (!validReason) {
            throw new Error("INVALID_REASON");
          }

          const queueDate = startOfTodayUtc();
          const latestToken =
            await transaction.queueEntry.aggregate({
              where: {
                serviceId: service.id,
                queueDate,
              },
              _max: {
                tokenNumber: true,
              },
            });

          const tokenNumber =
            (latestToken._max.tokenNumber ?? 0) + 1;
          const tokenLabel = `${service.tokenPrefix}-${String(
            tokenNumber,
          ).padStart(3, "0")}`;

          return transaction.queueEntry.create({
            data: {
              userId,
              serviceId: service.id,
              queueDate,
              tokenNumber,
              tokenLabel,
              reason,
              note: note || null,
              status: "WAITING",
            },
            select: {
              id: true,
            },
          });
        },
      );

      const queueEntry =
        await prisma.queueEntry.findUnique({
          where: {
            id: createdEntry.id,
          },
          select: queueEntrySelect,
        });

      if (!queueEntry) {
        throw new Error("QUEUE_ENTRY_NOT_FOUND");
      }

      response.status(201).json({
        success: true,
        data: {
          queue: formatQueueEntry(queueEntry),
        },
        message: "You have joined the queue.",
      });
    } catch (error) {
      if (error instanceof Error) {
        const knownErrors: Record<
          string,
          { status: number; code: string; message: string }
        > = {
          ACTIVE_QUEUE_EXISTS: {
            status: 409,
            code: "ACTIVE_QUEUE_EXISTS",
            message:
              "You are already in an active queue. Leave it before joining another service.",
          },
          SERVICE_NOT_FOUND: {
            status: 404,
            code: "SERVICE_NOT_FOUND",
            message:
              "The selected campus service does not exist.",
          },
          SERVICE_CLOSED: {
            status: 409,
            code: "SERVICE_CLOSED",
            message:
              "This service is currently closed or has no active counter.",
          },
          INVALID_REASON: {
            status: 400,
            code: "INVALID_REASON",
            message:
              "Please choose a valid reason for this service.",
          },
        };

        const knownError = knownErrors[error.message];

        if (knownError) {
          response.status(knownError.status).json({
            success: false,
            error: {
              code: knownError.code,
              message: knownError.message,
            },
          });

          return;
        }
      }

      sendQueueError(response, error);
    }
  },
);

queueRouter.patch(
  "/:queueId/cancel",
  async (request: Request, response: Response) => {
    try {
      const { userId } =
        (request as AuthenticatedRequest).auth;
      const rawQueueId = request.params.queueId;
      const queueId = Array.isArray(rawQueueId)
        ? rawQueueId[0]
        : rawQueueId;

      if (!queueId) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_QUEUE_ID",
            message: "A valid queue ID is required.",
          },
        });

        return;
      }

      const queueEntry =
        await prisma.queueEntry.findFirst({
          where: {
            id: queueId,
            userId,
            status: {
              in: ["WAITING", "CALLED"],
            },
          },
          select: {
            id: true,
          },
        });

      if (!queueEntry) {
        response.status(404).json({
          success: false,
          error: {
            code: "ACTIVE_QUEUE_NOT_FOUND",
            message:
              "This queue entry cannot be cancelled.",
          },
        });

        return;
      }

      await prisma.queueEntry.update({
        where: {
          id: queueEntry.id,
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      response.status(200).json({
        success: true,
        message: "You have left the queue.",
      });
    } catch (error) {
      sendQueueError(response, error);
    }
  },
);

export default queueRouter;
