import {
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";

import { loginUser } from "../../api/auth-api";
import AuthLayout from "../../components/auth/AuthLayout";
import type { LoginRole } from "../../types/auth";

function LoginPage() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialRole: LoginRole =
    searchParams.get("role") === "staff"
      ? "staff"
      : "student";

  const [role, setRole] =
    useState<LoginRole>(initialRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function changeRole(newRole: LoginRole) {
    setRole(newRole);
    setSearchParams({
      role: newRole,
    });

    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError(
        "Please enter both email and password.",
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setError(
        "Please enter a valid email address.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await loginUser({
        email: normalizedEmail,
        password,
        role,
      });

      if (user.role === "STUDENT") {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      navigate(user.role === "ADMIN" ? "/admin" : "/staff", {
        replace: true,
      });
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError(
          "Unable to sign in. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to access your queues, campus services, and account."
    >
      <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => changeRole("student")}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            role === "student"
              ? "bg-white text-violet-600 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Student
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => changeRole("staff")}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            role === "staff"
              ? "bg-white text-violet-600 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <BriefcaseBusiness className="h-4 w-4" />
          Staff
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-7 space-y-5"
      >
        <div>
          <label
            htmlFor="login-email"
            className="text-sm font-semibold text-gray-800"
          >
            College email
          </label>

          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="login-email"
              type="email"
              value={email}
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="student@college.ac.in"
              autoComplete="email"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="login-password"
              className="text-sm font-semibold text-gray-800"
            >
              Password
            </label>

            <button
              type="button"
              disabled={isSubmitting}
              className="text-sm font-semibold text-violet-600 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative mt-2">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="login-password"
              type="password"
              value={password}
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in as{" "}
              {role === "student"
                ? "Student"
                : "Staff"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {role === "student" ? (
        <p className="mt-7 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            Create student account
          </Link>
        </p>
      ) : (
        <p className="mt-7 text-center text-sm leading-6 text-gray-500">
          Use the shared staff account provided by your campus administrator.
        </p>
      )}
    </AuthLayout>
  );
}

export default LoginPage;