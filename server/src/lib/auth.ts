import "dotenv/config";

import type { Response } from "express";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "campusflow_token";

const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const AUTH_COOKIE_MAX_AGE_MS =
  AUTH_TOKEN_TTL_SECONDS * 1000;

const authRoles = [
  "STUDENT",
  "STAFF",
  "ADMIN",
] as const;

export type AuthRole = (typeof authRoles)[number];

export type AuthTokenPayload = {
  userId: string;
  role: AuthRole;
};

/*
 * Environment variable ko validate karke guaranteed
 * string return karta hai.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing from the server environment.",
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters.",
    );
  }

  return secret;
}

const JWT_SECRET = getJwtSecret();

function isAuthRole(value: unknown): value is AuthRole {
  return (
    typeof value === "string" &&
    authRoles.includes(value as AuthRole)
  );
}

export function signAuthToken(
  userId: string,
  role: AuthRole,
): string {
  return jwt.sign(
    {
      role,
    },
    JWT_SECRET,
    {
      subject: userId,
      expiresIn: AUTH_TOKEN_TTL_SECONDS,
      algorithm: "HS256",
    },
  );
}

export function verifyAuthToken(
  token: string,
): AuthTokenPayload | null {
  try {
    const decodedToken = jwt.verify(
      token,
      JWT_SECRET,
      {
        algorithms: ["HS256"],
      },
    );

    if (typeof decodedToken === "string") {
      return null;
    }

    const userId = decodedToken.sub;
    const role = decodedToken.role;

    if (
      typeof userId !== "string" ||
      !isAuthRole(role)
    ) {
      return null;
    }

    return {
      userId,
      role,
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(
  response: Response,
  token: string,
) {
  response.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookie(
  response: Response,
) {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}