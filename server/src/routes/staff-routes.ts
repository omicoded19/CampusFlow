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


staffRouter.get(
  "/analytics",
  async (_request: Request, response: Response) => {
    try {
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 6);

      const [services, weekEntries, recentEntries] =
        await Promise.all([
          prisma.service.findMany({
            orderBy: { title: "asc" },
            select: {
              slug: true,
              title: true,
              counters: {
                select: { isActive: true },
              },
            },
          }),
          prisma.queueEntry.findMany({
            where: {
              joinedAt: { gte: startOfWeek },
            },
            orderBy: { joinedAt: "asc" },
            select: {
              id: true,
              tokenLabel: true,
              status: true,
              joinedAt: true,
              calledAt: true,
              startedAt: true,
              completedAt: true,
              cancelledAt: true,
              updatedAt: true,
              user: {
                select: { fullName: true },
              },
              service: {
                select: {
                  slug: true,
                  title: true,
                },
              },
            },
          }),
          prisma.queueEntry.findMany({
            orderBy: { updatedAt: "desc" },
            take: 14,
            select: {
              id: true,
              tokenLabel: true,
              status: true,
              joinedAt: true,
              calledAt: true,
              startedAt: true,
              completedAt: true,
              cancelledAt: true,
              updatedAt: true,
              user: {
                select: { fullName: true },
              },
              service: {
                select: { title: true },
              },
            },
          }),
        ]);

      const todayEntries = weekEntries.filter(
        (entry) => entry.joinedAt >= startOfToday,
      );
      const completedToday = todayEntries.filter(
        (entry) => entry.status === "COMPLETED",
      );
      const skippedToday = todayEntries.filter(
        (entry) => entry.status === "SKIPPED",
      );

      const waitDurations = todayEntries
        .map((entry) => {
          const serviceStart = entry.calledAt ?? entry.startedAt;
          if (!serviceStart) return null;
          return Math.max(
            0,
            Math.round(
              (serviceStart.getTime() - entry.joinedAt.getTime()) /
                60000,
            ),
          );
        })
        .filter((value): value is number => value !== null);

      const serviceDurations = completedToday
        .map((entry) => {
          if (!entry.startedAt || !entry.completedAt) return null;
          return Math.max(
            0,
            Math.round(
              (entry.completedAt.getTime() - entry.startedAt.getTime()) /
                60000,
            ),
          );
        })
        .filter((value): value is number => value !== null);

      const average = (values: number[]) =>
        values.length === 0
          ? 0
          : Math.round(
              values.reduce((sum, value) => sum + value, 0) /
                values.length,
            );

      const hours = Array.from({ length: 11 }, (_, index) => 8 + index);
      const formatHour = (hour: number) => {
        if (hour === 12) return "12 PM";
        if (hour > 12) return `${hour - 12} PM`;
        return `${hour} AM`;
      };

      const visitorsOverTime = hours.map((hour) => ({
        label: formatHour(hour),
        value: todayEntries.filter(
          (entry) => entry.joinedAt.getHours() === hour,
        ).length,
      }));

      const averageWaitTrend = hours.map((hour) => {
        const values = todayEntries
          .filter((entry) => entry.joinedAt.getHours() === hour)
          .map((entry) => {
            const serviceStart = entry.calledAt ?? entry.startedAt;
            if (!serviceStart) return null;
            return Math.max(
              0,
              Math.round(
                (serviceStart.getTime() - entry.joinedAt.getTime()) /
                  60000,
              ),
            );
          })
          .filter((value): value is number => value !== null);

        return {
          label: formatHour(hour),
          value: average(values),
        };
      });

      const totalVisits = weekEntries.length;
      const topServices = services
        .map((service) => {
          const visits = weekEntries.filter(
            (entry) => entry.service.slug === service.slug,
          ).length;
          return {
            id: service.slug,
            title: service.title,
            visits,
            percentage:
              totalVisits === 0
                ? 0
                : Math.round((visits / totalVisits) * 100),
          };
        })
        .sort((left, right) => right.visits - left.visits)
        .slice(0, 5);

      const peakHours = [...visitorsOverTime]
        .sort((left, right) => right.value - left.value)
        .slice(0, 5);

      const logMessage = (status: string) => {
        switch (status) {
          case "COMPLETED":
            return "Service completed";
          case "SERVING":
            return "Service started";
          case "CALLED":
            return "Token called to counter";
          case "SKIPPED":
            return "Token marked as no-show";
          case "CANCELLED":
            return "Student left the queue";
          default:
            return "Student joined the queue";
        }
      };

      const logTimestamp = (entry: (typeof recentEntries)[number]) =>
        entry.completedAt ??
        entry.startedAt ??
        entry.calledAt ??
        entry.cancelledAt ??
        entry.updatedAt ??
        entry.joinedAt;

      const totalCounters = services.reduce(
        (sum, service) => sum + service.counters.length,
        0,
      );
      const activeCounters = services.reduce(
        (sum, service) =>
          sum + service.counters.filter((counter) => counter.isActive).length,
        0,
      );
      const completedOrSkipped = completedToday.length + skippedToday.length;

      response.status(200).json({
        success: true,
        data: {
          summary: {
            totalStudentsServed: completedToday.length,
            averageWaitTime: average(waitDurations),
            averageServiceTime: average(serviceDurations),
            noShowRate:
              completedOrSkipped === 0
                ? 0
                : Number(
                    ((skippedToday.length / completedOrSkipped) * 100).toFixed(1),
                  ),
            activeCounters,
            totalCounters,
          },
          visitorsOverTime,
          averageWaitTrend,
          topServices,
          peakHours,
          logs: recentEntries.map((entry) => ({
            id: entry.id,
            tokenLabel: entry.tokenLabel,
            serviceTitle: entry.service.title,
            studentName: entry.user.fullName,
            status: entry.status,
            message: logMessage(entry.status),
            timestamp: logTimestamp(entry),
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


staffRouter.patch(
  "/queues/:queueId/transfer",
  async (request: Request, response: Response) => {
    try {
      const rawQueueId = request.params.queueId;
      const queueId = Array.isArray(rawQueueId) ? rawQueueId[0] : rawQueueId;
      const body = (request.body ?? {}) as RequestBody;
      const serviceSlug = typeof body.serviceId === "string" ? body.serviceId.trim() : "";

      if (!queueId || !serviceSlug) {
        response.status(400).json({
          success: false,
          error: { code: "INVALID_TRANSFER", message: "A queue entry and destination service are required." },
        });
        return;
      }

      const [entry, destination] = await Promise.all([
        prisma.queueEntry.findUnique({
          where: { id: queueId },
          select: { id: true, status: true, serviceId: true, queueDate: true },
        }),
        prisma.service.findUnique({
          where: { slug: serviceSlug },
          select: { id: true, title: true, tokenPrefix: true, isOpen: true },
        }),
      ]);

      if (!entry || !activeStatuses.includes(entry.status as ActiveStatus)) {
        response.status(404).json({
          success: false,
          error: { code: "QUEUE_ENTRY_NOT_FOUND", message: "The active queue entry was not found." },
        });
        return;
      }

      if (!destination || !destination.isOpen) {
        response.status(409).json({
          success: false,
          error: { code: "DESTINATION_UNAVAILABLE", message: "The destination service is currently unavailable." },
        });
        return;
      }

      if (destination.id === entry.serviceId) {
        response.status(409).json({
          success: false,
          error: { code: "SAME_SERVICE", message: "Choose a different destination service." },
        });
        return;
      }

      const updatedEntry = await prisma.$transaction(async (transaction) => {
        const latest = await transaction.queueEntry.aggregate({
          where: { serviceId: destination.id, queueDate: entry.queueDate },
          _max: { tokenNumber: true },
        });
        const tokenNumber = (latest._max.tokenNumber ?? 0) + 1;
        const tokenLabel = `${destination.tokenPrefix}-${String(tokenNumber).padStart(3, "0")}`;

        return transaction.queueEntry.update({
          where: { id: queueId },
          data: {
            serviceId: destination.id,
            tokenNumber,
            tokenLabel,
            status: "WAITING",
            counterId: null,
            calledAt: null,
            startedAt: null,
          },
          select: { tokenLabel: true },
        });
      });

      response.status(200).json({
        success: true,
        message: `Transferred to ${destination.title} as ${updatedEntry.tokenLabel}.`,
      });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

staffRouter.get(
  "/admin-data",
  requireAuth(["ADMIN"]),
  async (_request: Request, response: Response) => {
    try {
      const [departments, services, staff] = await Promise.all([
        prisma.department.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            services: {
              select: {
                _count: {
                  select: {
                    queueEntries: { where: { status: { in: [...activeStatuses] } } },
                  },
                },
              },
            },
          },
        }),
        prisma.service.findMany({
          orderBy: { title: "asc" },
          select: {
            slug: true,
            title: true,
            description: true,
            isOpen: true,
            averageServiceMinutes: true,
            department: { select: { name: true } },
            counters: {
              orderBy: { label: "asc" },
              select: {
                id: true,
                label: true,
                isActive: true,
                staff: { select: { id: true, fullName: true, email: true } },
              },
            },
            _count: {
              select: {
                queueEntries: { where: { status: { in: [...activeStatuses] } } },
              },
            },
          },
        }),
        prisma.user.findMany({
          where: { role: { in: ["STAFF", "ADMIN"] } },
          orderBy: [{ role: "desc" }, { fullName: "asc" }],
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { assignedCounters: true } },
          },
        }),
      ]);

      response.status(200).json({
        success: true,
        data: {
          departments: departments.map((department) => ({
            id: department.id,
            name: department.name,
            slug: department.slug,
            description: department.description,
            serviceCount: department.services.length,
            activeQueueCount: department.services.reduce(
              (sum, service) => sum + service._count.queueEntries,
              0,
            ),
          })),
          services: services.map((service) => ({
            id: service.slug,
            title: service.title,
            description: service.description,
            department: service.department.name,
            isOpen: service.isOpen,
            activeCounters: service.counters.filter((counter) => counter.isActive).length,
            activeQueueCount: service._count.queueEntries,
            averageServiceMinutes: service.averageServiceMinutes,
            counters: service.counters,
          })),
          staff: staff.map((member) => ({
            id: member.id,
            fullName: member.fullName,
            email: member.email,
            role: member.role,
            assignedCounters: member._count.assignedCounters,
            createdAt: member.createdAt,
          })),
        },
      });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

staffRouter.patch(
  "/services/:serviceId",
  requireAuth(["ADMIN"]),
  async (request: Request, response: Response) => {
    try {
      const rawServiceId = request.params.serviceId;
      const serviceId = Array.isArray(rawServiceId) ? rawServiceId[0] : rawServiceId;
      const body = (request.body ?? {}) as RequestBody;
      if (!serviceId || typeof body.isOpen !== "boolean") {
        response.status(400).json({
          success: false,
          error: { code: "INVALID_SERVICE_UPDATE", message: "A valid service state is required." },
        });
        return;
      }
      await prisma.service.update({ where: { slug: serviceId }, data: { isOpen: body.isOpen } });
      response.status(200).json({ success: true, message: "Service availability updated." });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

staffRouter.patch(
  "/counters/:counterId",
  requireAuth(["ADMIN"]),
  async (request: Request, response: Response) => {
    try {
      const rawCounterId = request.params.counterId;
      const counterId = Array.isArray(rawCounterId) ? rawCounterId[0] : rawCounterId;
      const body = (request.body ?? {}) as RequestBody;
      if (!counterId || typeof body.isActive !== "boolean") {
        response.status(400).json({
          success: false,
          error: { code: "INVALID_COUNTER_UPDATE", message: "A valid counter state is required." },
        });
        return;
      }
      await prisma.counter.update({ where: { id: counterId }, data: { isActive: body.isActive } });
      response.status(200).json({ success: true, message: "Counter availability updated." });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

export default staffRouter;
