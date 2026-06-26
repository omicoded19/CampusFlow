import type {
  AuthErrorResponse,
  AuthMessageResponse,
  AuthUser,
  AuthUserResponse,
  LoginInput,
  RegisterStudentInput,
} from "../types/auth";

const apiUrl =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000";

async function readResponseJson<T>(
  response: Response,
): Promise<T> {
  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      "The server returned an invalid response.",
    );
  }

  return (await response.json()) as T;
}

function getErrorMessage(
  result: AuthErrorResponse,
): string {
  return (
    result.error.message ||
    "Unable to complete the authentication request."
  );
}

export async function registerStudent(
  input: RegisterStudentInput,
  signal?: AbortSignal,
): Promise<AuthUser> {
  const response = await fetch(
    `${apiUrl}/api/auth/register`,
    {
      method: "POST",
      credentials: "include",
      signal,

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify(input),
    },
  );

  const result = await readResponseJson<
    AuthUserResponse | AuthErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(getErrorMessage(result));
    }

    throw new Error(
      "Unable to create the student account.",
    );
  }

  return result.data.user;
}

export async function loginUser(
  input: LoginInput,
  signal?: AbortSignal,
): Promise<AuthUser> {
  const response = await fetch(
    `${apiUrl}/api/auth/login`,
    {
      method: "POST",
      credentials: "include",
      signal,

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify(input),
    },
  );

  const result = await readResponseJson<
    AuthUserResponse | AuthErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(getErrorMessage(result));
    }

    throw new Error("Unable to sign in.");
  }

  return result.data.user;
}

export async function getCurrentUser(
  signal?: AbortSignal,
): Promise<AuthUser> {
  const response = await fetch(
    `${apiUrl}/api/auth/me`,
    {
      method: "GET",
      credentials: "include",
      signal,

      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await readResponseJson<
    AuthUserResponse | AuthErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(getErrorMessage(result));
    }

    throw new Error(
      "Unable to retrieve the current user.",
    );
  }

  return result.data.user;
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(
    `${apiUrl}/api/auth/logout`,
    {
      method: "POST",
      credentials: "include",

      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await readResponseJson<
    AuthMessageResponse | AuthErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(getErrorMessage(result));
    }

    throw new Error("Unable to sign out.");
  }
}