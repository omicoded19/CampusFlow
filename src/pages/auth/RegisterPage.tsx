import {
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  BadgeCheck,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router";

import { registerStudent } from "../../api/auth-api";
import AuthLayout from "../../components/auth/AuthLayout";

function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] =
    useState("");

  const [collegeEmail, setCollegeEmail] =
    useState("");

  const [studentId, setStudentId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [error, setError] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const normalizedFullName =
      fullName.trim();

    const normalizedEmail =
      collegeEmail.trim().toLowerCase();

    const normalizedStudentId =
      studentId.trim().toUpperCase();

    if (
      !normalizedFullName ||
      !normalizedEmail ||
      !normalizedStudentId ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please complete all required fields.",
      );
      return;
    }

    if (
      normalizedFullName.length < 2 ||
      normalizedFullName.length > 80
    ) {
      setError(
        "Full name must contain between 2 and 80 characters.",
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setError(
        "Please enter a valid college email address.",
      );
      return;
    }

    if (
      normalizedStudentId.length < 2 ||
      normalizedStudentId.length > 40
    ) {
      setError(
        "Student ID must contain between 2 and 40 characters.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      await registerStudent({
        fullName: normalizedFullName,
        email: normalizedEmail,
        studentId: normalizedStudentId,
        password,
      });

      /*
       * Backend registration ke baad authentication
       * cookie bhi set karta hai, isliye separate
       * login ki zarurat nahi hai.
       */
      navigate("/dashboard", {
        replace: true,
      });
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError(
          "Unable to create your account.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Register as a student to remotely join and track campus queues."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="full-name"
            className="text-sm font-semibold text-gray-800"
          >
            Full name
          </label>

          <div className="relative mt-2">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="full-name"
              type="text"
              value={fullName}
              disabled={isSubmitting}
              onChange={(event) => {
                setFullName(event.target.value);
                setError("");
              }}
              placeholder="Enter your full name"
              autoComplete="name"
              className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="college-email"
            className="text-sm font-semibold text-gray-800"
          >
            College email
          </label>

          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="college-email"
              type="email"
              value={collegeEmail}
              disabled={isSubmitting}
              onChange={(event) => {
                setCollegeEmail(event.target.value);
                setError("");
              }}
              placeholder="student@college.ac.in"
              autoComplete="email"
              className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="student-id"
            className="text-sm font-semibold text-gray-800"
          >
            Student ID
          </label>

          <div className="relative mt-2">
            <BadgeCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="student-id"
              type="text"
              value={studentId}
              disabled={isSubmitting}
              onChange={(event) => {
                setStudentId(event.target.value);
                setError("");
              }}
              placeholder="Enter roll number or student ID"
              className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 uppercase outline-none transition placeholder:normal-case placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="text-sm font-semibold text-gray-800"
          >
            Password
          </label>

          <div className="relative mt-2">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="register-password"
              type="password"
              value={password}
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="text-sm font-semibold text-gray-800"
          >
            Confirm password
          </label>

          <div className="relative mt-2">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              disabled={isSubmitting}
              onChange={(event) => {
                setConfirmPassword(
                  event.target.value,
                );
                setError("");
              }}
              placeholder="Enter password again"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
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
              Creating account...
            </>
          ) : (
            <>
              Create student account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-gray-600">
        Already registered?{" "}
        <Link
          to="/login?role=student"
          className="font-semibold text-violet-600 hover:text-violet-700"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;