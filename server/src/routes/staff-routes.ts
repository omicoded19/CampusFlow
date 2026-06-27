import bcrypt from "bcryptjs";
import {
  Router,
  type Request,
  type Response,
} from "express";

import { prisma } from "../lib/prisma";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/require-auth";

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


async function getAccessibleServiceIds(
  request: Request,
): Promise<string[] | null> {
  const { userId, role } =
    (request as AuthenticatedRequest).auth;

  if (role === "ADMIN") {
    return null;
  }

  const counters = await prisma.counter.findMany({
    where: {
      staffId: userId,
      isActive: true,
    },
    select: {
      serviceId: true,
    },
  });

  return [...new Set(counters.map((counter) => counter.serviceId))];
}

function readRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  async (request: Request, response: Response) => {
    try {
      const { userId } =
        (request as AuthenticatedRequest).auth;
      const accessibleServiceIds =
        await getAccessibleServiceIds(request);

      const [services, queueEntries] =
        await Promise.all([
          prisma.service.findMany({
            where:
              accessibleServiceIds === null
                ? undefined
                : {
                    id: {
                      in: accessibleServiceIds,
                    },
                  },
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
                  staff: {
                    select: {
                      isActive: true,
                      role: true,
                    },
                  },
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
            where:
              accessibleServiceIds === null
                ? {
                    status: {
                      in: [...activeStatuses],
                    },
                  }
                : {
                    OR: [
                      {
                        serviceId: {
                          in: accessibleServiceIds,
                        },
                        status: "WAITING",
                      },
                      {
                        status: {
                          in: ["CALLED", "SERVING"],
                        },
                        counter: {
                          is: {
                            staffId: userId,
                          },
                        },
                      },
                    ],
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
              (counter) =>
                counter.isActive &&
                counter.staff?.isActive &&
                counter.staff.role === "STAFF",
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
  async (request: Request, response: Response) => {
    try {
      const accessibleServiceIds =
        await getAccessibleServiceIds(request);
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 6);

      const [services, weekEntries, recentEntries] =
        await Promise.all([
          prisma.service.findMany({
            where:
              accessibleServiceIds === null
                ? undefined
                : { id: { in: accessibleServiceIds } },
            orderBy: { title: "asc" },
            select: {
              slug: true,
              title: true,
              counters: {
                select: {
                  isActive: true,
                  staff: {
                    select: {
                      isActive: true,
                      role: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.queueEntry.findMany({
            where: {
              joinedAt: { gte: startOfWeek },
              ...(accessibleServiceIds === null
                ? {}
                : {
                    serviceId: {
                      in: accessibleServiceIds,
                    },
                  }),
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
            where:
              accessibleServiceIds === null
                ? undefined
                : {
                    serviceId: {
                      in: accessibleServiceIds,
                    },
                  },
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
          sum +
          service.counters.filter(
            (counter) =>
              counter.isActive &&
              counter.staff?.isActive &&
              counter.staff.role === "STAFF",
          ).length,
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
      const { userId, role } =
        (request as AuthenticatedRequest).auth;
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
            counter: {
              select: {
                staffId: true,
              },
            },
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

      let actionCounterId: string | null = null;

      if (role === "STAFF") {
        if (
          currentStatus !== "WAITING" &&
          existingEntry.counter?.staffId !== userId
        ) {
          response.status(403).json({
            success: false,
            error: {
              code: "COUNTER_NOT_ASSIGNED",
              message:
                "This token is being handled by another staff counter.",
            },
          });

          return;
        }

        const assignedCounter =
          await prisma.counter.findFirst({
            where: {
              serviceId: existingEntry.serviceId,
              staffId: userId,
              isActive: true,
              staff: {
                is: {
                  isActive: true,
                  role: "STAFF",
                },
              },
            },
            orderBy: {
              label: "asc",
            },
            select: {
              id: true,
            },
          });

        if (!assignedCounter) {
          response.status(403).json({
            success: false,
            error: {
              code: "NO_ACTIVE_COUNTER_ASSIGNMENT",
              message:
                "You need an active counter assignment for this service before handling its queue.",
            },
          });

          return;
        }

        actionCounterId = assignedCounter.id;
      } else if (status === "CALLED") {
        const availableCounter =
          await prisma.counter.findFirst({
            where: {
              serviceId: existingEntry.serviceId,
              isActive: true,
              staff: {
                is: {
                  isActive: true,
                  role: "STAFF",
                },
              },
            },
            orderBy: {
              label: "asc",
            },
            select: {
              id: true,
            },
          });

        if (!availableCounter) {
          response.status(409).json({
            success: false,
            error: {
              code: "NO_OPERATIONAL_COUNTER",
              message:
                "Assign an active staff member to an active counter before calling this token.",
            },
          });

          return;
        }

        actionCounterId = availableCounter.id;
      }

      const timestamp = new Date();

      const updateResult =
        await prisma.queueEntry.updateMany({
          where: {
            id: queueId,
            status: currentStatus,
          },
          data: {
            status,
            ...(status === "CALLED"
              ? {
                  calledAt: timestamp,
                  counterId: actionCounterId,
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

      if (updateResult.count === 0) {
        response.status(409).json({
          success: false,
          error: {
            code: "QUEUE_STATUS_CHANGED",
            message:
              "Another staff member updated this token. Refresh the queue and try again.",
          },
        });

        return;
      }

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
      const { userId, role } =
        (request as AuthenticatedRequest).auth;
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
          select: {
            id: true,
            status: true,
            serviceId: true,
            queueDate: true,
            counter: {
              select: {
                staffId: true,
              },
            },
          },
        }),
        prisma.service.findUnique({
          where: { slug: serviceSlug },
          select: {
            id: true,
            title: true,
            tokenPrefix: true,
            isOpen: true,
            counters: {
              where: {
                isActive: true,
                staff: {
                  is: {
                    isActive: true,
                    role: "STAFF",
                  },
                },
              },
              select: {
                id: true,
              },
            },
          },
        }),
      ]);

      if (!entry || !activeStatuses.includes(entry.status as ActiveStatus)) {
        response.status(404).json({
          success: false,
          error: { code: "QUEUE_ENTRY_NOT_FOUND", message: "The active queue entry was not found." },
        });
        return;
      }

      if (role === "STAFF") {
        const hasSourceAccess =
          entry.status === "WAITING"
            ? await prisma.counter.findFirst({
                where: {
                  serviceId: entry.serviceId,
                  staffId: userId,
                  isActive: true,
                },
                select: { id: true },
              })
            : entry.counter?.staffId === userId
              ? { id: "assigned" }
              : null;

        if (!hasSourceAccess) {
          response.status(403).json({
            success: false,
            error: {
              code: "TRANSFER_NOT_ALLOWED",
              message:
                "You can only transfer tokens from your assigned service or counter.",
            },
          });
          return;
        }
      }

      if (
        !destination ||
        !destination.isOpen ||
        destination.counters.length === 0
      ) {
        response.status(409).json({
          success: false,
          error: {
            code: "DESTINATION_UNAVAILABLE",
            message:
              "The destination service needs an active counter with an assigned staff member.",
          },
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
                staff: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    isActive: true,
                  },
                },
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
            isActive: true,
            createdAt: true,
            assignedCounters: {
              orderBy: {
                label: "asc",
              },
              select: {
                id: true,
                label: true,
                isActive: true,
                service: {
                  select: {
                    slug: true,
                    title: true,
                  },
                },
              },
            },
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
            activeCounters: service.counters.filter(
              (counter) =>
                counter.isActive &&
                counter.staff?.isActive,
            ).length,
            activeQueueCount: service._count.queueEntries,
            averageServiceMinutes: service.averageServiceMinutes,
            counters: service.counters,
          })),
          staff: staff.map((member) => ({
            id: member.id,
            fullName: member.fullName,
            email: member.email,
            role: member.role,
            isActive: member.isActive,
            assignedCounters: member.assignedCounters.map((counter) => ({
              id: counter.id,
              label: counter.label,
              isActive: counter.isActive,
              service: {
                id: counter.service.slug,
                title: counter.service.title,
              },
            })),
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


staffRouter.post(
  "/staff-members",
  requireAuth(["ADMIN"]),
  async (request: Request, response: Response) => {
    try {
      const body = (request.body ?? {}) as RequestBody;
      const fullName = readRequiredString(body.fullName);
      const email = readRequiredString(body.email).toLowerCase();
      const password =
        typeof body.password === "string" ? body.password : "";
      const counterIds = Array.isArray(body.counterIds)
        ? [...new Set(
            body.counterIds.filter(
              (value): value is string =>
                typeof value === "string" && value.trim().length > 0,
            ),
          )]
        : [];

      if (!fullName || !email || !password) {
        response.status(400).json({
          success: false,
          error: {
            code: "MISSING_STAFF_DETAILS",
            message:
              "Full name, email, and a temporary password are required.",
          },
        });
        return;
      }

      if (fullName.length < 2 || fullName.length > 80) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_STAFF_NAME",
            message:
              "Staff name must contain between 2 and 80 characters.",
          },
        });
        return;
      }

      if (!isValidEmail(email)) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_STAFF_EMAIL",
            message: "Enter a valid staff email address.",
          },
        });
        return;
      }

      if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_STAFF_PASSWORD",
            message:
              "The temporary password must contain 8 to 72 bytes.",
          },
        });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        response.status(409).json({
          success: false,
          error: {
            code: "STAFF_EMAIL_EXISTS",
            message:
              "An account with this email address already exists.",
          },
        });
        return;
      }

      if (counterIds.length > 0) {
        const counterCount = await prisma.counter.count({
          where: {
            id: {
              in: counterIds,
            },
          },
        });

        if (counterCount !== counterIds.length) {
          response.status(400).json({
            success: false,
            error: {
              code: "INVALID_COUNTER_SELECTION",
              message:
                "One or more selected counters no longer exist.",
            },
          });
          return;
        }
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const staffMember = await prisma.$transaction(
        async (transaction) => {
          const member = await transaction.user.create({
            data: {
              fullName,
              email,
              passwordHash,
              role: "STAFF",
              studentId: null,
              isActive: true,
            },
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          });

          if (counterIds.length > 0) {
            await transaction.counter.updateMany({
              where: {
                id: {
                  in: counterIds,
                },
              },
              data: {
                staffId: member.id,
              },
            });
          }

          return member;
        },
      );

      response.status(201).json({
        success: true,
        data: {
          staff: staffMember,
        },
        message: "Staff account created successfully.",
      });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

staffRouter.patch(
  "/staff-members/:staffId",
  requireAuth(["ADMIN"]),
  async (request: Request, response: Response) => {
    try {
      const rawStaffId = request.params.staffId;
      const staffId = Array.isArray(rawStaffId)
        ? rawStaffId[0]
        : rawStaffId;
      const body = (request.body ?? {}) as RequestBody;

      if (!staffId || typeof body.isActive !== "boolean") {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_STAFF_UPDATE",
            message: "A valid staff account state is required.",
          },
        });
        return;
      }

      const staffMember = await prisma.user.findUnique({
        where: { id: staffId },
        select: { id: true, role: true },
      });

      if (!staffMember || staffMember.role !== "STAFF") {
        response.status(404).json({
          success: false,
          error: {
            code: "STAFF_NOT_FOUND",
            message: "The selected staff account was not found.",
          },
        });
        return;
      }

      await prisma.user.update({
        where: { id: staffId },
        data: { isActive: body.isActive },
      });

      response.status(200).json({
        success: true,
        message: body.isActive
          ? "Staff account enabled."
          : "Staff account disabled.",
      });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

staffRouter.patch(
  "/counters/:counterId/assignment",
  requireAuth(["ADMIN"]),
  async (request: Request, response: Response) => {
    try {
      const rawCounterId = request.params.counterId;
      const counterId = Array.isArray(rawCounterId)
        ? rawCounterId[0]
        : rawCounterId;
      const body = (request.body ?? {}) as RequestBody;
      const staffId =
        body.staffId === null
          ? null
          : readRequiredString(body.staffId);

      if (!counterId || (body.staffId !== null && !staffId)) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_COUNTER_ASSIGNMENT",
            message:
              "A valid counter and staff assignment are required.",
          },
        });
        return;
      }

      const counter = await prisma.counter.findUnique({
        where: { id: counterId },
        select: { id: true },
      });

      if (!counter) {
        response.status(404).json({
          success: false,
          error: {
            code: "COUNTER_NOT_FOUND",
            message: "The selected counter was not found.",
          },
        });
        return;
      }

      if (staffId) {
        const staffMember = await prisma.user.findFirst({
          where: {
            id: staffId,
            role: "STAFF",
            isActive: true,
          },
          select: { id: true },
        });

        if (!staffMember) {
          response.status(409).json({
            success: false,
            error: {
              code: "STAFF_UNAVAILABLE",
              message:
                "Choose an active staff account for this counter.",
            },
          });
          return;
        }
      }

      await prisma.counter.update({
        where: { id: counterId },
        data: {
          staffId: staffId || null,
        },
      });

      response.status(200).json({
        success: true,
        message: staffId
          ? "Counter assignment updated."
          : "Counter is now unassigned.",
      });
    } catch (error) {
      sendStaffError(response, error);
    }
  },
);

export default staffRouter;
