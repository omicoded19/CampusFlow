import {
  Router,
  type Request,
  type Response,
} from "express";

import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/require-auth";

const staffRouter = Router();

const activeStatuses = [
  "WAITING",
  "CALLED",
  "SERVING",
] as const;

const allowedTransitions = {
  WAITING: ["CALLED", "SKIPPED"],
  CALLED: ["SERVING", "SKIPPED"],
  SERVING: ["COMPLETED"],
} as const;

type RequestBody = Record<string, unknown>;

type ActiveStatus = keyof typeof allowedTransitions;
type StaffActionStatus =
  (typeof allowedTransitions)[ActiveStatus][number];

function isStaffActionStatus(
  value: unknown,
): value is StaffActionStatus {
  return (
    typeof value === "string" &&
    [
      "CALLED",
      "SERVING",
      "COMPLETED",
      "SKIPPED",
    ].includes(value)
  );
}

function sendStaffError(
  response: Response,
  error: unknown,
) {
  console.error("Staff queue request failed:", error);

  response.status(500).json({
    success: false,
    error: {
      code: "STAFF_QUEUE_ERROR",
      message:
        "Unable to update the staff queue dashboard.",
    },
  });
}

staffRouter.use(requireAuth(["STAFF", "ADMIN"]));

staffRouter.get(
  "/dashboard",
  async (_request: Request, response: Response) => {
    try {
      const [services, queueEntries] =
        await Promise.all([
          prisma.service.findMany({
            orderBy: {
              title: "asc",
            },
            select: {
              slug: true,
              title: true,
              isOpen: true,
              department: {
                select: {
                  name: true,
                },
              },
              counters: {
                select: {
                  id: true,
                  label: true,
                  isActive: true,
                },
              },
              _count: {
                select: {
                  queueEntries: {
                    where: {
                      status: {
                        in: [...activeStatuses],
                      },
                    },
                  },
                },
              },
            },
          }),
          prisma.queueEntry.findMany({
            where: {
              status: {
                in: [...activeStatuses],
              },
            },
            orderBy: [
              {
                service: {
                  title: "asc",
                },
              },
              {
                joinedAt: "asc",
              },
            ],
            select: {
              id: true,
              tokenLabel: true,
              status: true,
              reason: true,
              note: true,
              joinedAt: true,
              user: {
                select: {
                  fullName: true,
                  studentId: true,
                },
              },
              service: {
                select: {
                  slug: true,
                  title: true,
                  department: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              counter: {
                select: {
                  label: true,
                },
              },
            },
          }),
        ]);

      response.status(200).json({
        success: true,
        data: {
          services: services.map((service) => ({
            id: service.slug,
            title: service.title,
            department: service.department.name,
            isOpen: service.isOpen,
            activeCounters: service.counters.filter(
              (counter) => counter.isActive,
            ).length,
            activeQueueCount:
              service._count.queueEntries,
          })),
          queueEntries: queueEntries.map((entry) => ({
            id: entry.id,
            tokenLabel: entry.tokenLabel,
            status: entry.status,
            reason: entry.reason,
            note: entry.note,
            joinedAt: entry.joinedAt,
            student: {
              fullName: entry.user.fullName,
              studentId: entry.user.studentId,
            },
            service: {
              id: entry.service.slug,
              title: entry.service.title,
              department:
                entry.service.department.name,
            },
            counterLabel:
              entry.counter?.label ?? null,
          })),
        },
      });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

staffRouter.patch(
  "/queues/:queueId/status",
  async (request: Request, response: Response) => {
    try {
      const rawQueueId = request.params.queueId;
      const queueId = Array.isArray(rawQueueId)
        ? rawQueueId[0]
        : rawQueueId;
      const body =
        (request.body ?? {}) as RequestBody;
      const status = body.status;

      if (!queueId || !isStaffActionStatus(status)) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_STATUS_UPDATE",
            message:
              "A valid queue ID and status are required.",
          },
        });

        return;
      }

      const existingEntry =
        await prisma.queueEntry.findUnique({
          where: {
            id: queueId,
          },
          select: {
            id: true,
            status: true,
            serviceId: true,
          },
        });

      if (!existingEntry) {
        response.status(404).json({
          success: false,
          error: {
            code: "QUEUE_ENTRY_NOT_FOUND",
            message:
              "The selected queue entry no longer exists.",
          },
        });

        return;
      }

      if (
        !activeStatuses.includes(
          existingEntry.status as ActiveStatus,
        )
      ) {
        response.status(409).json({
          success: false,
          error: {
            code: "QUEUE_ALREADY_CLOSED",
            message:
              "This queue entry has already been closed.",
          },
        });

        return;
      }

      const currentStatus =
        existingEntry.status as ActiveStatus;
      const validNextStatuses =
        allowedTransitions[currentStatus];

      if (
        !validNextStatuses.includes(
          status as never,
        )
      ) {
        response.status(409).json({
          success: false,
          error: {
            code: "INVALID_STATUS_TRANSITION",
            message: `A ${currentStatus.toLowerCase()} token cannot be changed directly to ${status.toLowerCase()}.`,
          },
        });

        return;
      }

      const firstActiveCounter =
        status === "CALLED"
          ? await prisma.counter.findFirst({
              where: {
                serviceId: existingEntry.serviceId,
                isActive: true,
              },
              orderBy: {
                label: "asc",
              },
              select: {
                id: true,
              },
            })
          : null;

      const timestamp = new Date();

      await prisma.queueEntry.update({
        where: {
          id: queueId,
        },
        data: {
          status,
          ...(status === "CALLED"
            ? {
                calledAt: timestamp,
                counterId:
                  firstActiveCounter?.id ?? null,
              }
            : {}),
          ...(status === "SERVING"
            ? {
                startedAt: timestamp,
              }
            : {}),
          ...(status === "COMPLETED"
            ? {
                completedAt: timestamp,
              }
            : {}),
        },
      });

      response.status(200).json({
        success: true,
        message: `Queue status changed to ${status.toLowerCase()}.`,
      });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

export default staffRouter;
