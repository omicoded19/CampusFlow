import {
  ArrowRight,
  Building2,
  CircleCheckBig,
  Clock3,
  RefreshCw,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router";

import { getServices } from "../../api/service-api";
import {
  cancelQueue,
  getMyActiveQueue,
  getMyQueueHistory,
} from "../../api/queue-api";
import StudentPageShell from "../../components/dashboard/StudentPageShell";
import type { AuthUser } from "../../types/auth";
import type { StudentQueue } from "../../types/queue";
import type { CampusService } from "../../types/service";

type StudentDashboardPageProps = {
  user: AuthUser;
};

type RequestStatus =
  | "loading"
  | "success"
  | "error";

function getQueueStatusLabel(queue: StudentQueue) {
  if (queue.status === "CALLED") {
    return "Please proceed to the counter";
  }

  if (queue.status === "SERVING") {
    return "Your service is in progress";
  }

  return queue.peopleAhead <= 2
    ? "Your turn is approaching"
    : "You are in the queue";
}

function StudentDashboardPage({
  user,
}: StudentDashboardPageProps) {
  const [services, setServices] =
    useState<CampusService[]>([]);
  const [activeQueue, setActiveQueue] =
    useState<StudentQueue | null>(null);
  const [completedCount, setCompletedCount] =
    useState(0);
  const [requestStatus, setRequestStatus] =
    useState<RequestStatus>("loading");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [requestNumber, setRequestNumber] =
    useState(0);
  const [isCancelling, setIsCancelling] =
    useState(false);

  const firstName =
    user.fullName.split(" ")[0] || "Student";

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setRequestStatus("loading");
        setErrorMessage("");

        const [serviceData, queueData, historyData] =
          await Promise.all([
            getServices(controller.signal),
            getMyActiveQueue(controller.signal),
            getMyQueueHistory(controller.signal),
          ]);

        setServices(serviceData);
        setActiveQueue(queueData);
        setCompletedCount(
          historyData.completedCount,
        );
        setRequestStatus("success");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setRequestStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your dashboard.",
        );
      }
    }

    void loadDashboard();

    return () => {
      controller.abort();
    };
  }, [requestNumber]);

  async function handleCancelQueue() {
    if (!activeQueue) {
      return;
    }

    const shouldCancel = window.confirm(
      `Leave the ${activeQueue.service.title} queue?`,
    );

    if (!shouldCancel) {
      return;
    }

    try {
      setIsCancelling(true);
      setErrorMessage("");
      await cancelQueue(activeQueue.id);
      setActiveQueue(null);
      setRequestNumber(
        (currentNumber) => currentNumber + 1,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to leave the queue.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  const openServices = services.filter(
    (service) => service.isOpen,
  ).length;

  return (
    <StudentPageShell
      user={user}
      eyebrow="Student Dashboard"
      title={`Welcome back, ${firstName}`}
    >
      {errorMessage && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {errorMessage}
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
              queue updates, and arrive when your
              turn is near.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={requestStatus === "loading"}
              onClick={() =>
                setRequestNumber(
                  (currentNumber) =>
                    currentNumber + 1,
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  requestStatus === "loading"
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>

            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
            >
              Browse services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
          <p className="mt-1 truncate text-2xl font-bold text-gray-950">
            {activeQueue
              ? activeQueue.tokenLabel
              : "None"}
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
            {activeQueue
              ? `${activeQueue.estimatedWait} min`
              : "0 min"}
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
            {completedCount}
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
            {requestStatus === "success"
              ? openServices
              : "—"}
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
                Your active campus service token and
                live position.
              </p>
            </div>
            <UsersRound className="h-6 w-6 text-gray-400" />
          </div>

          {requestStatus === "loading" ? (
            <div className="mt-8 min-h-64 animate-pulse rounded-2xl bg-gray-100" />
          ) : activeQueue ? (
            <div className="mt-8 rounded-3xl border border-violet-200 bg-violet-50 p-6">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                    {getQueueStatusLabel(
                      activeQueue,
                    )}
                  </p>
                  <p className="mt-2 text-5xl font-bold text-violet-950">
                    {activeQueue.tokenLabel}
                  </p>
                  <h3 className="mt-4 text-xl font-bold text-gray-950">
                    {activeQueue.service.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {activeQueue.service.department}
                    {activeQueue.counterLabel
                      ? ` · ${activeQueue.counterLabel}`
                      : ""}
                  </p>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    {activeQueue.reason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:min-w-64">
                  <div className="rounded-2xl bg-white p-4 text-center">
                    <p className="text-2xl font-bold text-gray-950">
                      {activeQueue.peopleAhead}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Ahead of you
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-center">
                    <p className="text-2xl font-bold text-gray-950">
                      {activeQueue.estimatedWait}m
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Estimated wait
                    </p>
                  </div>
                </div>
              </div>

              {activeQueue.nowServingToken && (
                <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-violet-800">
                  Now serving: {" "}
                  {activeQueue.nowServingToken}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-violet-200 pt-6 sm:flex-row">
                <Link
                  to={`/services/${activeQueue.service.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  View queue details
                </Link>

                {(activeQueue.status === "WAITING" ||
                  activeQueue.status === "CALLED") && (
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => {
                      void handleCancelQueue();
                    }}
                    className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {isCancelling
                      ? "Leaving..."
                      : "Leave queue"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center">
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
                to="/services"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Find a service
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <TicketCheck className="h-5 w-5 text-violet-600" />
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
                {user.studentId ?? "Not provided"}
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
    </StudentPageShell>
  );
}

export default StudentDashboardPage;
