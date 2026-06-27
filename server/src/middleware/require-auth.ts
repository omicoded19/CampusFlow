import {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  verifyAuthToken,
  type AuthRole,
  type AuthTokenPayload,
} from "../lib/auth";
import { prisma } from "../lib/prisma";

export type AuthenticatedRequest = Request & {
  auth: AuthTokenPayload;
};

export function requireAuth(
  allowedRoles?: AuthRole[],
) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const cookieValue =
      request.cookies?.[AUTH_COOKIE_NAME] as unknown;

    if (typeof cookieValue !== "string") {
      response.status(401).json({
        success: false,
        error: {
          code: "NOT_AUTHENTICATED",
          message: "Please sign in to continue.",
        },
      });

      return;
    }

    const payload = verifyAuthToken(cookieValue);

    if (!payload) {
      clearAuthCookie(response);

      response.status(401).json({
        success: false,
        error: {
          code: "INVALID_SESSION",
          message:
            "Your session is invalid or has expired. Please sign in again.",
        },
      });

      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        clearAuthCookie(response);

        response.status(401).json({
          success: false,
          error: {
            code: user
              ? "ACCOUNT_DISABLED"
              : "USER_NOT_FOUND",
            message: user
              ? "This account has been disabled by an administrator."
              : "The account associated with this session no longer exists.",
          },
        });

        return;
      }

      if (
        user.role !== payload.role ||
        (allowedRoles &&
          !allowedRoles.includes(user.role as AuthRole))
      ) {
        response.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              "Your account does not have permission to perform this action.",
          },
        });

        return;
      }

      (request as AuthenticatedRequest).auth = {
        userId: user.id,
        role: user.role as AuthRole,
      };

      next();
    } catch (error) {
      console.error("Authentication validation failed:", error);

      response.status(500).json({
        success: false,
        error: {
          code: "AUTHORIZATION_ERROR",
          message:
            "Unable to validate your session right now.",
        },
      });
    }
  };
}
