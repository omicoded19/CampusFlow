import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  CircleCheckBig,
  Clock3,
  LogOut,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router";

import { logoutUser } from "../../api/auth-api";
import StudentSidebar from "../../components/dashboard/StudentSidebar";
import type { AuthUser } from "../../types/auth";

type StudentDashboardPageProps = {
  user: AuthUser;
};

function StudentDashboardPage({
  user,
}: StudentDashboardPageProps) {
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [logoutError, setLogoutError] =
    useState("");

  const firstName =
    user.fullName.split(" ")[0] || "Student";

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      setLogoutError("");

      await logoutUser();

      navigate("/login?role=student", {
        replace: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        setLogoutError(error.message);
      } else {
        setLogoutError(
          "Unable to sign out. Please try again.",
        );
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7fb]">
      <StudentSidebar
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="min-w-0 flex-1">
        <header className="border-b border-gray-200 bg-white px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Student Dashboard
              </p>

              <h1 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">
                Welcome back, {firstName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              >
                <Bell className="h-5 w-5" />

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600" />
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => {
                  void handleLogout();
                }}
                className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 lg:hidden"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {logoutError && (
            <p
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {logoutError}
            </p>
          )}

          <section className="rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-lg shadow-violet-100 sm:p-8">
            <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold text-violet-100">
                  Queue smarter, not longer
                </p>

                <h2 className="mt-2 max-w-2xl text-2xl font-bold sm:text-3xl">
                  Join campus service queues before
                  reaching the office.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100 sm:text-base">
                  Check live waiting times, receive
                  updates, and arrive when your turn
                  is near.
                </p>
              </div>

              <Link
                to="/#services"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
              >
                Browse services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <TicketCheck className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                Active queue
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-950">
                None
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock3 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                Estimated wait
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-950">
                0 min
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CircleCheckBig className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                Completed visits
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-950">
                0
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Building2 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                Available services
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-950">
                6
              </p>
            </article>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">
                    Current queue
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Your active campus service token
                    will appear here.
                  </p>
                </div>

                <UsersRound className="h-6 w-6 text-gray-400" />
              </div>

              <div className="mt-8 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <TicketCheck className="h-6 w-6" />
                </div>

                <h3 className="mt-4 font-bold text-gray-950">
                  You are not in a queue
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  Select an available campus service
                  and join its queue remotely.
                </p>

                <Link
                  to="/#services"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Find a service
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-violet-600" />

                <h2 className="text-lg font-bold text-gray-950">
                  Account details
                </h2>
              </div>

              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Full name
                  </dt>

                  <dd className="mt-1 font-semibold text-gray-900">
                    {user.fullName}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    College email
                  </dt>

                  <dd className="mt-1 break-all font-semibold text-gray-900">
                    {user.email}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Student ID
                  </dt>

                  <dd className="mt-1 font-semibold text-gray-900">
                    {user.studentId ??
                      "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Account role
                  </dt>

                  <dd className="mt-1">
                    <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                      {user.role}
                    </span>
                  </dd>
                </div>
              </dl>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboardPage;