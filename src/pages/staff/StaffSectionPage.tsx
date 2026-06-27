import {
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  Copy,
  Megaphone,
  Play,
  SkipForward,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getStaffAnalytics,
  getStaffDashboard,
  transferQueueEntry,
  updateQueueStatus,
} from "../../api/staff-api";
import OperationsPageShell from "../../components/staff/OperationsPageShell";
import type { AuthUser } from "../../types/auth";
import type {
  StaffAnalyticsData,
  StaffQueueAction,
  StaffQueueEntry,
  StaffServiceSummary,
} from "../../types/staff";

type StaffSection =
  | "current"
  | "queues"
  | "history"
  | "transfers"
  | "announcements"
  | "profile";

type StaffSectionPageProps = {
  user: AuthUser;
  section: StaffSection;
};

const sectionMeta: Record<StaffSection, { title: string; subtitle: string }> = {
  current: { title: "Current Queue", subtitle: "Call, serve, complete, or skip the next student token." },
  queues: { title: "All Active Queues", subtitle: "Monitor every waiting, called, and serving token." },
  history: { title: "Queue History", subtitle: "Review recent completed, skipped, and cancelled queue activity." },
  transfers: { title: "Queue Transfers", subtitle: "Move an active token to another available campus service." },
  announcements: { title: "Announcements", subtitle: "Prepare counter announcements and copy them for display or broadcast." },
  profile: { title: "Staff Profile", subtitle: "View your CampusFlow account and operational access." },
};

const statusStyles: Record<string, string> = {
  WAITING: "bg-violet-100 text-violet-700",
  CALLED: "bg-blue-100 text-blue-700",
  SERVING: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  SKIPPED: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-rose-100 text-rose-700",
};

function actionFor(entry: StaffQueueEntry): { label: string; status: StaffQueueAction; className: string; icon: typeof Play } | null {
  if (entry.status === "WAITING") return { label: "Call", status: "CALLED", className: "bg-blue-600 text-white hover:bg-blue-700", icon: Play };
  if (entry.status === "CALLED") return { label: "Start", status: "SERVING", className: "bg-emerald-600 text-white hover:bg-emerald-700", icon: Play };
  if (entry.status === "SERVING") return { label: "Complete", status: "COMPLETED", className: "bg-emerald-600 text-white hover:bg-emerald-700", icon: CheckCircle2 };
  return null;
}

function StaffSectionPage({ user, section }: StaffSectionPageProps) {
  const [services, setServices] = useState<StaffServiceSummary[]>([]);
  const [entries, setEntries] = useState<StaffQueueEntry[]>([]);
  const [analytics, setAnalytics] = useState<StaffAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);
  const [updatingId, setUpdatingId] = useState("");
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("Token holders are requested to remain near their selected service counter.");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [dashboard, analyticsData] = await Promise.all([
          getStaffDashboard(controller.signal),
          getStaffAnalytics(controller.signal),
        ]);
        setServices(dashboard.services);
        setEntries(dashboard.queueEntries);
        setAnalytics(analyticsData);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to load staff operations.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [requestNumber]);

  const current = useMemo(
    () => entries.find((entry) => entry.status === "SERVING") ?? entries.find((entry) => entry.status === "CALLED") ?? entries[0] ?? null,
    [entries],
  );

  async function updateStatus(entry: StaffQueueEntry, status: StaffQueueAction) {
    try {
      setUpdatingId(entry.id);
      setErrorMessage("");
      await updateQueueStatus(entry.id, status);
      setRequestNumber((value) => value + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update token.");
    } finally {
      setUpdatingId("");
    }
  }

  async function transfer(entry: StaffQueueEntry) {
    const destination = transferTargets[entry.id];
    if (!destination) return;
    try {
      setUpdatingId(entry.id);
      setErrorMessage("");
      await transferQueueEntry(entry.id, destination);
      setRequestNumber((value) => value + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to transfer token.");
    } finally {
      setUpdatingId("");
    }
  }

  const meta = sectionMeta[section];

  return (
    <OperationsPageShell
      user={user}
      mode="staff"
      eyebrow="CampusFlow Staff Portal"
      title={meta.title}
      subtitle={meta.subtitle}
      onRefresh={() => setRequestNumber((value) => value + 1)}
      isRefreshing={isLoading}
    >
      {errorMessage && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{errorMessage}</p>}

      {section === "current" && (
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">Currently serving</p>
            {current ? (
              <>
                <div className="mt-5 text-center">
                  <p className="text-6xl font-black tracking-tight text-violet-600">{current.tokenLabel}</p>
                  <p className="mt-3 text-lg font-bold text-slate-950">{current.student.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{current.service.title} · {current.reason}</p>
                </div>
                <div className="mt-7 space-y-3">
                  {actionFor(current) && (() => {
                    const action = actionFor(current)!;
                    const Icon = action.icon;
                    return (
                      <button
                        type="button"
                        disabled={updatingId === current.id}
                        onClick={() => void updateStatus(current, action.status)}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${action.className}`}
                      >
                        <Icon className="h-4 w-4" />{action.label} {current.tokenLabel}
                      </button>
                    );
                  })()}
                  {current.status !== "SERVING" && (
                    <button
                      type="button"
                      disabled={updatingId === current.id}
                      onClick={() => void updateStatus(current, "SKIPPED")}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-amber-950 hover:bg-amber-500"
                    >
                      <SkipForward className="h-4 w-4" />Mark no-show
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-500">No active token is waiting.</div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">Queue ({entries.length})</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><UserRound className="h-4 w-4 text-slate-500" /></div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950">{entry.tokenLabel} <span className="font-medium text-slate-500">· {entry.student.fullName}</span></p>
                      <p className="truncate text-xs text-slate-500">{entry.service.title}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[entry.status]}`}>{entry.status}</span>
                </div>
              ))}
              {!isLoading && entries.length === 0 && <p className="py-16 text-center text-slate-500">No active queue entries.</p>}
            </div>
          </article>
        </div>
      )}

      {section === "queues" && (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5"><UsersRound className="h-5 w-5 text-violet-600" /><h2 className="font-extrabold text-slate-950">Live queue board</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Token</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Service</th><th className="px-5 py-3">Reason</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead>
              <tbody>{entries.map((entry) => {
                const action = actionFor(entry);
                return <tr key={entry.id} className="border-t border-slate-100"><td className="px-5 py-4 font-black text-violet-700">{entry.tokenLabel}</td><td className="px-5 py-4 font-semibold">{entry.student.fullName}</td><td className="px-5 py-4 text-slate-600">{entry.service.title}</td><td className="px-5 py-4 text-slate-600">{entry.reason}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[entry.status]}`}>{entry.status}</span></td><td className="px-5 py-4">{action && <button type="button" onClick={() => void updateStatus(entry, action.status)} className={`rounded-lg px-3 py-2 text-xs font-bold ${action.className}`}>{action.label}</button>}</td></tr>;
              })}</tbody>
            </table>
          </div>
        </article>
      )}

      {section === "history" && (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5"><ClipboardList className="h-5 w-5 text-violet-600" /><h2 className="font-extrabold text-slate-950">Recent service events</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Token</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Service</th><th className="px-5 py-3">Event</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{(analytics?.logs ?? []).map((log) => <tr key={log.id} className="border-t border-slate-100"><td className="px-5 py-4 font-black text-violet-700">{log.tokenLabel}</td><td className="px-5 py-4 font-semibold">{log.studentName}</td><td className="px-5 py-4 text-slate-600">{log.serviceTitle}</td><td className="px-5 py-4 text-slate-600">{log.message}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[log.status]}`}>{log.status}</span></td></tr>)}</tbody></table></div>
        </article>
      )}

      {section === "transfers" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><p className="text-2xl font-black text-violet-700">{entry.tokenLabel}</p><p className="mt-1 font-bold text-slate-950">{entry.student.fullName}</p><p className="text-sm text-slate-500">Currently in {entry.service.title}</p></div><ArrowRightLeft className="h-6 w-6 text-slate-400" /></div>
              <div className="mt-5 flex gap-3">
                <select value={transferTargets[entry.id] ?? ""} onChange={(event) => setTransferTargets((value) => ({ ...value, [entry.id]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400">
                  <option value="">Choose destination</option>
                  {services.filter((service) => service.isOpen && service.id !== entry.service.id).map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
                </select>
                <button type="button" disabled={!transferTargets[entry.id] || updatingId === entry.id} onClick={() => void transfer(entry)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Transfer</button>
              </div>
            </article>
          ))}
          {!isLoading && entries.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500">No active tokens are available to transfer.</div>}
        </div>
      )}

      {section === "announcements" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Megaphone className="h-6 w-6 text-violet-600" /><h2 className="text-lg font-extrabold text-slate-950">Announcement composer</h2></div>
            <textarea value={announcement} onChange={(event) => setAnnouncement(event.target.value)} rows={7} className="mt-5 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
            <button type="button" onClick={() => { void navigator.clipboard.writeText(announcement); setCopyMessage("Copied to clipboard"); }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"><Copy className="h-4 w-4" />Copy announcement</button>
            {copyMessage && <p className="mt-3 text-sm font-semibold text-emerald-600">{copyMessage}</p>}
          </article>
          <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">Live preview</p><p className="mt-8 text-2xl font-extrabold leading-relaxed">{announcement || "Your announcement will appear here."}</p>
          </article>
        </div>
      )}

      {section === "profile" && (
        <article className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700"><UserRound className="h-8 w-8" /></div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-950">{user.fullName}</h2>
          <p className="mt-1 text-slate-500">{user.email}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase text-slate-400">Role</p><p className="mt-1 font-bold text-slate-900">{user.role}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase text-slate-400">Active services</p><p className="mt-1 font-bold text-slate-900">{services.filter((service) => service.isOpen).length}</p></div></div>
        </article>
      )}
    </OperationsPageShell>
  );
}

export default StaffSectionPage;
