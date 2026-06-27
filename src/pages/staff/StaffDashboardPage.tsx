import {
  CheckCircle2,
  RefreshCw,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { logoutUser } from "../../api/auth-api";
import {
  getStaffAnalytics,
  getStaffDashboard,
  updateQueueStatus,
} from "../../api/staff-api";
import OperationsSidebar from "../../components/staff/OperationsSidebar";
import type { AuthUser } from "../../types/auth";
import type {
  StaffAnalyticsData,
  StaffQueueAction,
  StaffQueueEntry,
  StaffServiceSummary,
} from "../../types/staff";

type StaffDashboardPageProps = { user: AuthUser };

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusChip(status: StaffQueueEntry["status"]) {
  if (status === "SERVING") return "bg-emerald-100 text-emerald-700";
  if (status === "CALLED") return "bg-blue-100 text-blue-700";
  return "bg-violet-100 text-violet-700";
}

function StaffDashboardPage({ user }: StaffDashboardPageProps) {
  const navigate = useNavigate();
  const [services, setServices] = useState<StaffServiceSummary[]>([]);
  const [queueEntries, setQueueEntries] = useState<StaffQueueEntry[]>([]);
  const [analytics, setAnalytics] = useState<StaffAnalyticsData | null>(null);
  const [selectedService, setSelectedService] = useState("all");
  const [requestNumber, setRequestNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingQueueId, setUpdatingQueueId] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [dashboardData, analyticsData] = await Promise.all([
          getStaffDashboard(controller.signal),
          getStaffAnalytics(controller.signal),
        ]);
        setServices(dashboardData.services);
        setQueueEntries(dashboardData.queueEntries);
        setAnalytics(analyticsData);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to load staff operations.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [requestNumber]);

  const visibleEntries = useMemo(
    () =>
      selectedService === "all"
        ? queueEntries
        : queueEntries.filter((entry) => entry.service.id === selectedService),
    [queueEntries, selectedService],
  );

  const currentEntry =
    visibleEntries.find((entry) => entry.status === "SERVING") ??
    visibleEntries.find((entry) => entry.status === "CALLED") ??
    visibleEntries.find((entry) => entry.status === "WAITING") ??
    null;
  const nextWaitingEntry = visibleEntries.find(
    (entry) => entry.status === "WAITING" && entry.id !== currentEntry?.id,
  );
  const selectedServiceData =
    services.find((service) => service.id === selectedService) ?? services[0] ?? null;

  async function handleStatusUpdate(queueId: string, status: StaffQueueAction) {
    try {
      setUpdatingQueueId(queueId);
      setErrorMessage("");
      await updateQueueStatus(queueId, status);
      setRequestNumber((value) => value + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update token status.");
    } finally {
      setUpdatingQueueId("");
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      navigate("/login?role=staff", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <OperationsSidebar
        user={user}
        mode="staff"
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="mx-auto flex max-w-[1420px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedService}
                onChange={(event) => setSelectedService(event.target.value)}
                className="rounded-lg border-0 bg-transparent text-lg font-extrabold text-slate-950 outline-none"
              >
                <option value="all">All Campus Services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.title}</option>
                ))}
              </select>
              <span className="text-slate-300">•</span>
              <strong className="text-sm text-slate-700">
                {selectedServiceData?.activeCounters ?? 0} active counters
              </strong>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-700">
                Open
              </span>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Staff</p>
                <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-violet-200 text-xs font-extrabold text-violet-800">
                {user.fullName.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1420px] px-5 py-6 sm:px-7">
          {errorMessage && (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{errorMessage}</p>
          )}

          <section id="current-queue" className="grid gap-5 xl:grid-cols-[0.9fr_1.25fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-slate-950">Currently Serving</h2>

              {isLoading ? (
                <div className="mt-5 h-[315px] animate-pulse rounded-xl bg-slate-100" />
              ) : currentEntry ? (
                <div className="mt-5 text-center">
                  <p className="text-6xl font-black tracking-tight text-violet-600">{currentEntry.tokenLabel}</p>
                  <p className="mt-3 font-extrabold text-slate-950">{currentEntry.student.fullName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {currentEntry.status === "SERVING"
                      ? `Started at ${formatTime(currentEntry.joinedAt)}`
                      : currentEntry.status === "CALLED"
                        ? "Token called — waiting at counter"
                        : "Next token ready to call"}
                  </p>

                  <div className="mt-6 space-y-2.5">
                    {currentEntry.status === "SERVING" && (
                      <button
                        type="button"
                        disabled={updatingQueueId === currentEntry.id}
                        onClick={() => void handleStatusUpdate(currentEntry.id, "COMPLETED")}
                        className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                      >
                        Complete Service
                      </button>
                    )}

                    {currentEntry.status === "CALLED" && (
                      <button
                        type="button"
                        disabled={updatingQueueId === currentEntry.id}
                        onClick={() => void handleStatusUpdate(currentEntry.id, "SERVING")}
                        className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-60"
                      >
                        Start Service
                      </button>
                    )}

                    {currentEntry.status === "WAITING" && (
                      <button
                        type="button"
                        disabled={updatingQueueId === currentEntry.id}
                        onClick={() => void handleStatusUpdate(currentEntry.id, "CALLED")}
                        className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-60"
                      >
                        Call Next ({currentEntry.tokenLabel})
                      </button>
                    )}

                    {currentEntry.status !== "SERVING" && (
                      <button
                        type="button"
                        disabled={updatingQueueId === currentEntry.id}
                        onClick={() => void handleStatusUpdate(currentEntry.id, "SKIPPED")}
                        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-amber-950 transition hover:bg-amber-500 disabled:opacity-60"
                      >
                        Mark No-show
                      </button>
                    )}

                    {currentEntry.status === "SERVING" && nextWaitingEntry && (
                      <button
                        type="button"
                        disabled={updatingQueueId === nextWaitingEntry.id}
                        onClick={() => void handleStatusUpdate(nextWaitingEntry.id, "CALLED")}
                        className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-60"
                      >
                        Call Next ({nextWaitingEntry.tokenLabel})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setRequestNumber((value) => value + 1)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Refresh Queue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex min-h-[315px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <h3 className="mt-4 font-extrabold text-slate-950">Queue is clear</h3>
                  <p className="mt-1 text-sm text-slate-500">Student tokens will appear here.</p>
                  <button type="button" onClick={() => setRequestNumber((value) => value + 1)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                    <RefreshCw className="h-4 w-4" />Refresh
                  </button>
                </div>
              )}
            </article>

            <article id="all-queues" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-extrabold text-slate-950">Queue ({visibleEntries.length})</h2>
                  <p className="mt-1 text-xs text-slate-500">Live student tokens in service order</p>
                </div>
                <button type="button" onClick={() => setRequestNumber((value) => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Refresh
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                {visibleEntries.length === 0 ? (
                  <div className="flex min-h-[340px] flex-col items-center justify-center bg-slate-50 text-center">
                    <UsersRound className="h-9 w-9 text-slate-400" />
                    <p className="mt-3 font-bold text-slate-800">No active tokens</p>
                  </div>
                ) : (
                  <div className="max-h-[430px] overflow-y-auto">
                    {visibleEntries.map((entry) => (
                      <div key={entry.id} className="grid grid-cols-[32px_76px_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50">
                        <UserRound className="h-4 w-4 text-slate-500" />
                        <strong className="text-sm text-slate-900">{entry.tokenLabel}</strong>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{entry.student.fullName}</p>
                          <p className="truncate text-[11px] text-slate-500">{entry.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusChip(entry.status)}`}>{entry.status}</span>
                          <p className="mt-1 text-[10px] text-slate-400">{formatTime(entry.joinedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </section>

          <section id="metrics" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-xs text-slate-500">Today&apos;s Served</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{analytics?.summary.totalStudentsServed ?? 0}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-xs text-slate-500">Avg. Service Time</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{analytics?.summary.averageServiceTime ?? 0} min</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-xs text-slate-500">No-show Rate</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{analytics?.summary.noShowRate ?? 0}%</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-xs text-slate-500">Counters Active</p>
              <p className="mt-2 text-3xl font-black text-violet-700">
                {analytics?.summary.activeCounters ?? 0}<span className="text-slate-400"> / {analytics?.summary.totalCounters ?? 0}</span>
              </p>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}

export default StaffDashboardPage;
