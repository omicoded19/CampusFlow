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

export type AuthenticatedRequest = Request & {
  auth: AuthTokenPayload;
};

export function requireAuth(
  allowedRoles?: AuthRole[],
) {
  return (
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

    if (
      allowedRoles &&
      !allowedRoles.includes(payload.role)
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

    (request as AuthenticatedRequest).auth = payload;
    next();
  };
}
