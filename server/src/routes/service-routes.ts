import {
  Router,
  type Request,
  type Response,
} from "express";

import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

const serviceRouter = Router();

/*
 * Prisma ko clearly batata hai ki database se
 * kaunse Service fields aur relations chahiye.
 */
const serviceSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  iconKey: true,
  tokenPrefix: true,
  isOpen: true,
  averageServiceMinutes: true,

  department: {
    select: {
      name: true,
    },
  },

  reasons: {
    orderBy: {
      position: "asc" as const,
    },
    select: {
      label: true,
    },
  },

  counters: {
    select: {
      isActive: true,
      staff: true,
    },
  },

  queueEntries: {
    where: {
      status: "WAITING" as const,
    },
    select: {
      id: true,
    },
  },
} satisfies Prisma.ServiceSelect;

/*
 * serviceSelect ke basis par Prisma automatically
 * complete result type generate karta hai.
 */
type ServiceWithQueueData = Prisma.ServiceGetPayload<{
  select: typeof serviceSelect;
}>;

function isOperationalCounter(counter: {
  isActive: boolean;
  staff: unknown;
}) {
  const staff = counter.staff as {
    isActive?: boolean;
    role?: string;
  } | null;

  return Boolean(
    counter.isActive &&
      staff?.isActive &&
      staff.role === "STAFF",
  );
}

function formatService(service: ServiceWithQueueData) {
  const activeCounters = service.counters.filter(
    isOperationalCounter,
  ).length;

  const peopleWaiting = service.queueEntries.length;

  const canAcceptStudents =
    service.isOpen && activeCounters > 0;

  const waitTime = canAcceptStudents
    ? Math.ceil(
        (peopleWaiting * service.averageServiceMinutes) /
          activeCounters,
      )
    : 0;

  return {
    id: service.slug,
    iconKey: service.iconKey,
    department: service.department.name,
    title: service.title,
    description: service.description,
    reasons: service.reasons.map((reason) => reason.label),
    waitTime,
    peopleWaiting,
    activeCounters,
    isOpen: canAcceptStudents,
  };
}

function handleDatabaseError(
  response: Response,
  error: unknown,
) {
  console.error("Service database request failed:", error);

  response.status(500).json({
    success: false,
    error: {
      code: "DATABASE_ERROR",
      message:
        "Unable to retrieve campus services from the database.",
    },
  });
}

/*
 * GET /api/services
 *
 * Database se saari services return karta hai.
 */
serviceRouter.get(
  "/",
  async (_request: Request, response: Response) => {
    try {
      const databaseServices =
        await prisma.service.findMany({
          select: serviceSelect,

          orderBy: {
            title: "asc",
          },
        });

      const services = databaseServices.map(formatService);

      response.status(200).json({
        success: true,
        data: {
          services,
          count: services.length,
        },
      });
    } catch (error) {
      handleDatabaseError(response, error);
    }
  },
);

/*
 * GET /api/services/:serviceId
 *
 * Service slug ke through single service return karta hai.
 */
serviceRouter.get(
  "/:serviceId",
  async (request: Request, response: Response) => {
    try {
      const rawServiceId = request.params.serviceId;

      /*
       * Express typings ke according route parameter
       * string ya string[] ho sakta hai.
       *
       * Prisma ko sirf string deni hai.
       */
      const serviceId = Array.isArray(rawServiceId)
        ? rawServiceId[0]
        : rawServiceId;

      if (!serviceId) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_SERVICE_ID",
            message: "A valid service ID is required.",
          },
        });

        return;
      }

      const databaseService =
        await prisma.service.findUnique({
          where: {
            slug: serviceId,
          },

          select: serviceSelect,
        });

      if (!databaseService) {
        response.status(404).json({
          success: false,
          error: {
            code: "SERVICE_NOT_FOUND",
            message:
              "The requested campus service does not exist.",
          },
        });

        return;
      }

      response.status(200).json({
        success: true,
        data: {
          service: formatService(databaseService),
        },
      });
    } catch (error) {
      handleDatabaseError(response, error);
    }
  },
);

export default serviceRouter;