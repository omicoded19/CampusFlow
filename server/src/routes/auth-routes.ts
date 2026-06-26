import bcrypt from "bcryptjs";
import {
  Router,
  type Request,
  type Response,
} from "express";

import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  setAuthCookie,
  signAuthToken,
  verifyAuthToken,
  type AuthRole,
} from "../lib/auth";
import { prisma } from "../lib/prisma";

const authRouter = Router();

type RequestBody = Record<string, unknown>;

function readTrimmedString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readPassword(value: unknown): string {
  return typeof value === "string"
    ? value
    : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function sendServerError(
  response: Response,
  error: unknown,
) {
  console.error("Authentication request failed:", error);

  response.status(500).json({
    success: false,
    error: {
      code: "AUTHENTICATION_ERROR",
      message:
        "Unable to complete the authentication request.",
    },
  });
}

/*
 * POST /api/auth/register
 *
 * Creates a new student account.
 */
authRouter.post(
  "/register",
  async (request: Request, response: Response) => {
    try {
      const body =
        (request.body ?? {}) as RequestBody;

      const fullName = readTrimmedString(
        body.fullName,
      );

      const email = readTrimmedString(
        body.email,
      ).toLowerCase();

      const studentId = readTrimmedString(
        body.studentId,
      ).toUpperCase();

      const password = readPassword(
        body.password,
      );

      if (
        !fullName ||
        !email ||
        !studentId ||
        !password
      ) {
        response.status(400).json({
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message:
              "Full name, email, student ID, and password are required.",
          },
        });

        return;
      }

      if (
        fullName.length < 2 ||
        fullName.length > 80
      ) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_FULL_NAME",
            message:
              "Full name must contain between 2 and 80 characters.",
          },
        });

        return;
      }

      if (!isValidEmail(email)) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_EMAIL",
            message:
              "Please enter a valid email address.",
          },
        });

        return;
      }

      if (
        studentId.length < 2 ||
        studentId.length > 40
      ) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_STUDENT_ID",
            message:
              "Student ID must contain between 2 and 40 characters.",
          },
        });

        return;
      }

      if (password.length < 8) {
        response.status(400).json({
          success: false,
          error: {
            code: "WEAK_PASSWORD",
            message:
              "Password must contain at least 8 characters.",
          },
        });

        return;
      }

      if (
        Buffer.byteLength(password, "utf8") > 72
      ) {
        response.status(400).json({
          success: false,
          error: {
            code: "PASSWORD_TOO_LONG",
            message:
              "Password must not exceed 72 bytes.",
          },
        });

        return;
      }

      const existingUser =
        await prisma.user.findFirst({
          where: {
            OR: [
              {
                email,
              },
              {
                studentId,
              },
            ],
          },

          select: {
            email: true,
            studentId: true,
          },
        });

      if (existingUser) {
        const duplicateField =
          existingUser.email === email
            ? "email"
            : "student ID";

        response.status(409).json({
          success: false,
          error: {
            code: "ACCOUNT_ALREADY_EXISTS",
            message:
              `An account with this ${duplicateField} already exists.`,
          },
        });

        return;
      }

      const passwordHash = await bcrypt.hash(
        password,
        12,
      );

      const user = await prisma.user.create({
        data: {
          fullName,
          email,
          studentId,
          passwordHash,
          role: "STUDENT",
        },

        select: {
          id: true,
          fullName: true,
          email: true,
          studentId: true,
          role: true,
          createdAt: true,
        },
      });

      const token = signAuthToken(
        user.id,
        user.role as AuthRole,
      );

      setAuthCookie(response, token);

      response.status(201).json({
        success: true,
        data: {
          user,
        },
        message:
          "Student account created successfully.",
      });
    } catch (error) {
      sendServerError(response, error);
    }
  },
);

/*
 * POST /api/auth/login
 *
 * Logs in a student, staff member, or admin.
 */
authRouter.post(
  "/login",
  async (request: Request, response: Response) => {
    try {
      const body =
        (request.body ?? {}) as RequestBody;

      const email = readTrimmedString(
        body.email,
      ).toLowerCase();

      const password = readPassword(
        body.password,
      );

      const requestedRole = readTrimmedString(
        body.role,
      ).toLowerCase();

      if (!email || !password) {
        response.status(400).json({
          success: false,
          error: {
            code: "MISSING_CREDENTIALS",
            message:
              "Email and password are required.",
          },
        });

        return;
      }

      if (
        requestedRole !== "student" &&
        requestedRole !== "staff"
      ) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_LOGIN_ROLE",
            message:
              "Login role must be student or staff.",
          },
        });

        return;
      }

      const user = await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          fullName: true,
          email: true,
          studentId: true,
          role: true,
          passwordHash: true,
          createdAt: true,
        },
      });

      if (!user) {
        response.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message:
              "The email or password is incorrect.",
          },
        });

        return;
      }

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.passwordHash,
        );

      if (!passwordMatches) {
        response.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message:
              "The email or password is incorrect.",
          },
        });

        return;
      }

      const roleMatches =
        requestedRole === "student"
          ? user.role === "STUDENT"
          : user.role === "STAFF" ||
            user.role === "ADMIN";

      if (!roleMatches) {
        response.status(403).json({
          success: false,
          error: {
            code: "ROLE_MISMATCH",
            message:
              "This account cannot use the selected login portal.",
          },
        });

        return;
      }

      const token = signAuthToken(
        user.id,
        user.role as AuthRole,
      );

      setAuthCookie(response, token);

        const publicUser = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        createdAt: user.createdAt,
        };

        response.status(200).json({
        success: true,
        data: {
            user: publicUser,
        },
        message: "Login successful.",
        });
    } catch (error) {
      sendServerError(response, error);
    }
  },
);

/*
 * GET /api/auth/me
 *
 * Returns the currently authenticated user.
 */
authRouter.get(
  "/me",
  async (request: Request, response: Response) => {
    try {
      const cookieValue =
        request.cookies?.[AUTH_COOKIE_NAME] as unknown;

      if (typeof cookieValue !== "string") {
        response.status(401).json({
          success: false,
          error: {
            code: "NOT_AUTHENTICATED",
            message:
              "You are not currently signed in.",
          },
        });

        return;
      }

      const tokenPayload =
        verifyAuthToken(cookieValue);

      if (!tokenPayload) {
        clearAuthCookie(response);

        response.status(401).json({
          success: false,
          error: {
            code: "INVALID_SESSION",
            message:
              "Your session is invalid or has expired.",
          },
        });

        return;
      }

      const user = await prisma.user.findUnique({
        where: {
          id: tokenPayload.userId,
        },

        select: {
          id: true,
          fullName: true,
          email: true,
          studentId: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        clearAuthCookie(response);

        response.status(401).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message:
              "The user associated with this session no longer exists.",
          },
        });

        return;
      }

      response.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      sendServerError(response, error);
    }
  },
);

/*
 * POST /api/auth/logout
 *
 * Removes the authentication cookie.
 */
authRouter.post(
  "/logout",
  (_request: Request, response: Response) => {
    clearAuthCookie(response);

    response.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  },
);

export default authRouter;