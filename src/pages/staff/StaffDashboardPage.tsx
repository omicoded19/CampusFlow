import {
  CheckCircle2,
  Clock3,
  LogOut,
  Play,
  RefreshCw,
  SkipForward,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";

import { logoutUser } from "../../api/auth-api";
import {
  getStaffDashboard,
  updateQueueStatus,
} from "../../api/staff-api";
import type { AuthUser } from "../../types/auth";
import type {
  StaffQueueAction,
  StaffQueueEntry,
  StaffServiceSummary,
} from "../../types/staff";

type StaffDashboardPageProps = {
  user: AuthUser;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StaffDashboardPage({
  user,
}: StaffDashboardPageProps) {
  const navigate = useNavigate();
  const [services, setServices] = useState<
    StaffServiceSummary[]
  >([]);
  const [queueEntries, setQueueEntries] =
    useState<StaffQueueEntry[]>([]);
  const [selectedService, setSelectedService] =
    useState("all");
  const [isLoading, setIsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [requestNumber, setRequestNumber] =
    useState(0);
  const [updatingQueueId, setUpdatingQueueId] =
    useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const data = await getStaffDashboard(
          controller.signal,
        );
        setServices(data.services);
        setQueueEntries(data.queueEntries);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the staff dashboard.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [requestNumber]);

  const visibleEntries = useMemo(
    () =>
      selectedService === "all"
        ? queueEntries
        : queueEntries.filter(
            (entry) =>
              entry.service.id ===
              selectedService,
          ),
    [queueEntries, selectedService],
  );

  async function handleStatusUpdate(
    queueId: string,
    status: StaffQueueAction,
  ) {
    try {
      setUpdatingQueueId(queueId);
      setErrorMessage("");
      await updateQueueStatus(queueId, status);
      setRequestNumber(
        (currentNumber) => currentNumber + 1,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the token.",
      );
    } finally {
      setUpdatingQueueId(null);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      navigate("/login?role=staff", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign out.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  const waitingCount = queueEntries.filter(
    (entry) => entry.status === "WAITING",
  ).length;
  const calledCount = queueEntries.filter(
    (entry) => entry.status === "CALLED",
  ).length;
  const servingCount = queueEntries.filter(
    (entry) => entry.status === "SERVING",
  ).length;

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <header className="border-b border-gray-200 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-600">
              CampusFlow Staff Portal
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-950">
              Queue Operations Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Signed in as {user.fullName}
            </p>
          </div>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => {
              void handleLogout();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {errorMessage && (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <UsersRound className="h-6 w-6 text-violet-600" />
            <p className="mt-4 text-sm text-gray-500">
              Waiting
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-950">
              {waitingCount}
            </p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <TicketCheck className="h-6 w-6 text-amber-600" />
            <p className="mt-4 text-sm text-gray-500">
              Called
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-950">
              {calledCount}
            </p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <Play className="h-6 w-6 text-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              Serving
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-950">
              {servingCount}
            </p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <Clock3 className="h-6 w-6 text-emerald-600" />
            <p className="mt-4 text-sm text-gray-500">
              Active services
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-950">
              {
                services.filter(
                  (service) => service.isOpen,
                ).length
              }
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-950">
                Active queue tokens
              </h2>
              <p className="mt-2 text-gray-600">
                Call students, begin service, complete
                requests, or skip unavailable tokens.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedService}
                onChange={(event) =>
                  setSelectedService(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
              >
                <option value="all">
                  All services
                </option>
                {services.map((service) => (
                  <option
                    key={service.id}
                    value={service.id}
                  >
                    {service.title} ({
                      service.activeQueueCount
                    })
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setRequestNumber(
                    (currentNumber) =>
                      currentNumber + 1,
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isLoading
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 space-y-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-2xl bg-gray-100"
                  />
                ),
              )}
            </div>
          ) : visibleEntries.length === 0 ? (
            <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              <h3 className="mt-4 text-lg font-bold text-gray-950">
                No active tokens
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                New student queue entries will appear
                here.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {visibleEntries.map((entry) => {
                const isUpdating =
                  updatingQueueId === entry.id;

                return (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-700">
                          {entry.tokenLabel}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-950">
                              {entry.student.fullName}
                            </h3>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                              {entry.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {entry.student.studentId ??
                              "No student ID"} · {" "}
                            {entry.service.title} · {" "}
                            joined {formatTime(entry.joinedAt)}
                          </p>
                          <p className="mt-2 text-sm font-medium text-gray-700">
                            {entry.reason}
                          </p>
                          {entry.counterLabel && (
                            <p className="mt-1 text-sm text-violet-700">
                              {entry.counterLabel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {entry.status === "WAITING" && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                void handleStatusUpdate(
                                  entry.id,
                                  "CALLED",
                                );
                              }}
                              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Call token
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                void handleStatusUpdate(
                                  entry.id,
                                  "SKIPPED",
                                );
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 disabled:opacity-60"
                            >
                              <SkipForward className="h-4 w-4" />
                              Skip
                            </button>
                          </>
                        )}

                        {entry.status === "CALLED" && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                void handleStatusUpdate(
                                  entry.id,
                                  "SERVING",
                                );
                              }}
                              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Start service
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                void handleStatusUpdate(
                                  entry.id,
                                  "SKIPPED",
                                );
                              }}
                              className="rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 disabled:opacity-60"
                            >
                              Skip
                            </button>
                          </>
                        )}

                        {entry.status === "SERVING" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => {
                              void handleStatusUpdate(
                                entry.id,
                                "COMPLETED",
                              );
                            }}
                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            Complete service
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StaffDashboardPage;
