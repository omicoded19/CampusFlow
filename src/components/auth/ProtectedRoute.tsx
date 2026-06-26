import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate } from "react-router";

import { getCurrentUser } from "../../api/auth-api";
import type {
  AuthUser,
  AuthUserRole,
} from "../../types/auth";

type ProtectedRouteProps = {
  children: (user: AuthUser) => ReactNode;
  allowedRoles?: AuthUserRole[];
};

type AuthCheckStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated";

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const [status, setStatus] =
    useState<AuthCheckStatus>("checking");

  const [user, setUser] =
    useState<AuthUser | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function checkAuthentication() {
      try {
        const currentUser = await getCurrentUser(
          controller.signal,
        );

        setUser(currentUser);
        setStatus("authenticated");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setUser(null);
        setStatus("unauthenticated");
      }
    }

    void checkAuthentication();

    return () => {
      controller.abort();
    };
  }, []);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-violet-600" />

          <p className="mt-4 font-semibold text-gray-900">
            Checking your session...
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Please wait while CampusFlow verifies
            your account.
          </p>
        </div>
      </main>
    );
  }

  if (
    status === "unauthenticated" ||
    !user
  ) {
    return (
      <Navigate
        to="/login?role=student"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children(user);
}

export default ProtectedRoute;