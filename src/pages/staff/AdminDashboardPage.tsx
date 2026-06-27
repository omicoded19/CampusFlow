import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  RefreshCw,
  ScrollText,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { logoutUser } from "../../api/auth-api";
import { getStaffAnalytics, getStaffDashboard } from "../../api/staff-api";
import { DonutChart, LineChart, PeakHoursChart } from "../../components/admin/AdminCharts";
import OperationsSidebar from "../../components/staff/OperationsSidebar";
import type { AuthUser } from "../../types/auth";
import type { StaffAnalyticsData, StaffServiceSummary } from "../../types/staff";

type AdminDashboardPageProps = { user: AuthUser };

const statusStyles: Record<string, string> = {
  WAITING: "bg-violet-100 text-violet-700",
  CALLED: "bg-blue-100 text-blue-700",
  SERVING: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  SKIPPED: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-rose-100 text-rose-700",
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function AdminDashboardPage({ user }: AdminDashboardPageProps) {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<StaffAnalyticsData | null>(null);
  const [services, setServices] = useState<StaffServiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [analyticsData, dashboardData] = await Promise.all([
          getStaffAnalytics(controller.signal),
          getStaffDashboard(controller.signal),
        ]);
        setAnalytics(analyticsData);
        setServices(dashboardData.services);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to load analytics.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadAnalytics();
    return () => controller.abort();
  }, [requestNumber]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      navigate("/login?role=staff", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  const summary = analytics?.summary;

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <OperationsSidebar user={user} mode="admin" isLoggingOut={isLoggingOut} onLogout={handleLogout} />

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="mx-auto flex max-w-[1460px] flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">Campus operations</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Dashboard Overview</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRequestNumber((value) => value + 1)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                Today <CalendarDays className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1460px] px-5 py-6 sm:px-7">
          {errorMessage && (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{errorMessage}</p>
          )}

          <section id="summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Total Students Served</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{summary?.totalStudentsServed ?? 0}</p>
                </div>
                <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600"><UsersRound className="h-5 w-5" /></div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><ArrowUpRight className="h-3.5 w-3.5" />Live completed visits today</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Average Wait Time</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{summary?.averageWaitTime ?? 0} min</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600"><Clock3 className="h-5 w-5" /></div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><ArrowDownRight className="h-3.5 w-3.5" />Calculated from live queue events</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">No-show Rate</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{summary?.noShowRate ?? 0}%</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600"><Activity className="h-5 w-5" /></div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500">Skipped tokens versus served tokens</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Active Counters</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {summary?.activeCounters ?? 0}<span className="text-slate-400"> / {summary?.totalCounters ?? 0}</span>
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600"><Activity className="h-5 w-5" /></div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500">Currently enabled across campus</p>
            </article>
          </section>

          <section id="analytics" className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-slate-950">Visitors Over Time</h2>
              <p className="mt-1 text-xs text-slate-500">Queue joins by hour today</p>
              <div className="mt-4">
                <LineChart points={analytics?.visitorsOverTime ?? []} />
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-slate-950">Top Services by Visits</h2>
              <p className="mt-1 text-xs text-slate-500">Distribution over the last seven days</p>
              <div className="mt-7">
                <DonutChart services={analytics?.topServices ?? []} />
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-slate-950">Average Wait Time Trend</h2>
              <p className="mt-1 text-xs text-slate-500">Minutes from joining to being called</p>
              <div className="mt-4">
                <LineChart points={analytics?.averageWaitTrend ?? []} suffix="m" />
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-slate-950">Peak Hours</h2>
              <p className="mt-1 text-xs text-slate-500">Busiest queue-entry windows today</p>
              <div className="mt-7">
                <PeakHoursChart points={analytics?.peakHours ?? []} />
              </div>
            </article>
          </section>

          <section id="services" className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-slate-950">Service Operations</h2>
                <p className="mt-1 text-xs text-slate-500">Live counters and active queue sizes</p>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{services.length} services</span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service, index) => {
                const colors = [
                  "border-violet-200 bg-violet-50",
                  "border-emerald-200 bg-emerald-50",
                  "border-amber-200 bg-amber-50",
                  "border-blue-200 bg-blue-50",
                  "border-rose-200 bg-rose-50",
                  "border-teal-200 bg-teal-50",
                ];
                return (
                  <article key={service.id} className={`rounded-xl border p-4 ${colors[index % colors.length]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">{service.department}</p>
                        <h3 className="mt-1 font-extrabold text-slate-950">{service.title}</h3>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${service.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                        {service.isOpen ? "OPEN" : "CLOSED"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                      <div className="rounded-lg bg-white/80 p-3"><strong className="text-xl text-slate-950">{service.activeQueueCount}</strong><p className="text-[10px] text-slate-500">Active queue</p></div>
                      <div className="rounded-lg bg-white/80 p-3"><strong className="text-xl text-slate-950">{service.activeCounters}</strong><p className="text-[10px] text-slate-500">Counters</p></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="logs" className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600"><ScrollText className="h-5 w-5" /></div>
              <div>
                <h2 className="font-extrabold text-slate-950">System Logs</h2>
                <p className="mt-1 text-xs text-slate-500">Recent queue events from the database</p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.logs ?? []).map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatTimestamp(log.timestamp)}</td>
                      <td className="px-4 py-3 font-extrabold text-violet-700">{log.tokenLabel}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{log.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{log.serviceTitle}</td>
                      <td className="px-4 py-3 text-slate-600">{log.message}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[log.status] ?? "bg-slate-100 text-slate-600"}`}>{log.status}</span></td>
                    </tr>
                  ))}
                  {!isLoading && (analytics?.logs.length ?? 0) === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No queue events recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
