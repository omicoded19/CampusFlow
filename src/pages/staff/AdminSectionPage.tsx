import {
  Building2,
  CircleUserRound,
  KeyRound,
  Mail,
  ScrollText,
  Settings,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  UserX,
  UsersRound,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  createStaffMember,
  getAdminData,
  getStaffAnalytics,
  updateCounterAvailability,
  updateServiceAvailability,
  updateStaffMemberStatus,
} from "../../api/staff-api";
import { DonutChart, LineChart, PeakHoursChart } from "../../components/admin/AdminCharts";
import OperationsPageShell from "../../components/staff/OperationsPageShell";
import type { AuthUser } from "../../types/auth";
import type { AdminData, StaffAnalyticsData } from "../../types/staff";

type AdminSection =
  | "departments"
  | "services"
  | "counters"
  | "staff"
  | "analytics"
  | "logs"
  | "settings"
  | "profile";

type AdminSectionPageProps = {
  user: AuthUser;
  section: AdminSection;
};

const sectionMeta: Record<AdminSection, { title: string; subtitle: string }> = {
  departments: { title: "Departments", subtitle: "Review campus departments and their live service load." },
  services: { title: "Services", subtitle: "Open or close services and monitor current queue demand." },
  counters: { title: "Counters", subtitle: "Enable or disable individual service counters." },
  staff: { title: "Staff Management", subtitle: "View staff accounts and their current counter assignments." },
  analytics: { title: "Analytics", subtitle: "Explore queue traffic, wait-time trends, and service distribution." },
  logs: { title: "System Logs", subtitle: "Audit recent queue events and status changes." },
  settings: { title: "Operations Settings", subtitle: "Control service availability and review system defaults." },
  profile: { title: "Admin Profile", subtitle: "View your CampusFlow administrative account." },
};

const statusStyles: Record<string, string> = {
  WAITING: "bg-violet-100 text-violet-700",
  CALLED: "bg-blue-100 text-blue-700",
  SERVING: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  SKIPPED: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-rose-100 text-rose-700",
};

function AdminSectionPage({ user, section }: AdminSectionPageProps) {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [analytics, setAnalytics] = useState<StaffAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);
  const [updatingId, setUpdatingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [staffForm, setStaffForm] = useState({
    fullName: "",
    email: "",
    password: "",
    counterIds: [] as string[],
  });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [data, analyticsData] = await Promise.all([
          getAdminData(controller.signal),
          getStaffAnalytics(controller.signal),
        ]);
        setAdminData(data);
        setAnalytics(analyticsData);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to load admin operations.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [requestNumber]);

  const totalCounters = useMemo(
    () => adminData?.services.reduce((sum, service) => sum + service.counters.length, 0) ?? 0,
    [adminData],
  );

  async function toggleService(serviceId: string, isOpen: boolean) {
    try {
      setUpdatingId(serviceId);
      await updateServiceAvailability(serviceId, isOpen);
      setRequestNumber((value) => value + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update service.");
    } finally {
      setUpdatingId("");
    }
  }

  async function toggleCounter(counterId: string, isActive: boolean) {
    try {
      setUpdatingId(counterId);
      await updateCounterAvailability(counterId, isActive);
      setRequestNumber((value) => value + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update counter.");
    } finally {
      setUpdatingId("");
    }
  }

  async function submitStaffMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setUpdatingId("create-staff");
      setErrorMessage("");
      setSuccessMessage("");
      await createStaffMember(staffForm);
      setStaffForm({
        fullName: "",
        email: "",
        password: "",
        counterIds: [],
      });
      setSuccessMessage("Staff account created and ready to use.");
      setRequestNumber((value) => value + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the staff account.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function toggleStaffMember(staffId: string, isActive: boolean) {
    try {
      setUpdatingId(staffId);
      setErrorMessage("");
      setSuccessMessage("");
      await updateStaffMemberStatus(staffId, isActive);
      setSuccessMessage(
        isActive
          ? "Staff account enabled."
          : "Staff account disabled.",
      );
      setRequestNumber((value) => value + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the staff account.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  const allCounters = (adminData?.services ?? []).flatMap((service) =>
    service.counters.map((counter) => ({
      ...counter,
      serviceId: service.id,
      serviceTitle: service.title,
    })),
  );

  const meta = sectionMeta[section];

  return (
    <OperationsPageShell
      user={user}
      mode="admin"
      eyebrow="CampusFlow Admin Portal"
      title={meta.title}
      subtitle={meta.subtitle}
      onRefresh={() => setRequestNumber((value) => value + 1)}
      isRefreshing={isLoading}
    >
      {errorMessage && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{errorMessage}</p>}
      {successMessage && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{successMessage}</p>}

      {section === "departments" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(adminData?.departments ?? []).map((department, index) => {
            const colors = ["from-violet-50 to-indigo-50 border-violet-200", "from-emerald-50 to-teal-50 border-emerald-200", "from-amber-50 to-orange-50 border-amber-200", "from-blue-50 to-cyan-50 border-blue-200", "from-rose-50 to-pink-50 border-rose-200", "from-cyan-50 to-sky-50 border-cyan-200"];
            return (
              <article key={department.id} className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${colors[index % colors.length]}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/75 text-violet-700"><Building2 className="h-5 w-5" /></div>
                <h2 className="mt-4 text-lg font-extrabold text-slate-950">{department.name}</h2>
                <p className="mt-1 min-h-10 text-sm text-slate-600">{department.description ?? "Campus service department"}</p>
                <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/75 p-3 text-center"><p className="text-2xl font-black text-slate-950">{department.serviceCount}</p><p className="text-[11px] text-slate-500">Services</p></div><div className="rounded-xl bg-white/75 p-3 text-center"><p className="text-2xl font-black text-slate-950">{department.activeQueueCount}</p><p className="text-[11px] text-slate-500">Active queue</p></div></div>
              </article>
            );
          })}
        </div>
      )}

      {section === "services" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(adminData?.services ?? []).map((service, index) => {
            const colors = ["border-violet-200 bg-violet-50", "border-emerald-200 bg-emerald-50", "border-amber-200 bg-amber-50", "border-blue-200 bg-blue-50", "border-rose-200 bg-rose-50", "border-cyan-200 bg-cyan-50"];
            const statusLabel = !service.isOpen
              ? "CLOSED"
              : service.activeCounters > 0
                ? "OPEN"
                : "NO ACTIVE COUNTERS";
            const statusClass = !service.isOpen
              ? "bg-slate-200 text-slate-500"
              : service.activeCounters > 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800";
            return (
              <article key={service.id} className={`rounded-2xl border p-5 shadow-sm ${colors[index % colors.length]}`}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-slate-500">{service.department}</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">{service.title}</h2></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusClass}`}>{statusLabel}</span></div>
                <p className="mt-3 min-h-10 text-sm text-slate-600">{service.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-white/75 p-3"><strong className="text-lg">{service.activeQueueCount}</strong><p className="text-[10px] text-slate-500">Queue</p></div><div className="rounded-lg bg-white/75 p-3"><strong className="text-lg">{service.activeCounters}</strong><p className="text-[10px] text-slate-500">Active</p></div><div className="rounded-lg bg-white/75 p-3"><strong className="text-lg">{service.averageServiceMinutes}m</strong><p className="text-[10px] text-slate-500">Avg.</p></div></div>
                <button type="button" disabled={updatingId === service.id} onClick={() => void toggleService(service.id, !service.isOpen)} className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold ${service.isOpen ? "border border-red-200 bg-white text-red-600 hover:bg-red-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>{service.isOpen ? "Close Service" : "Open Service"}</button>
              </article>
            );
          })}
        </div>
      )}

      {section === "counters" && (
        <div className="space-y-5">
          {(adminData?.services ?? []).map((service) => (
            <article
              key={service.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-violet-600">
                    {service.department}
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-950">
                    {service.title}
                  </h2>
                </div>
                <span className="text-sm font-semibold text-slate-500">
                  {service.activeCounters}/{service.counters.length} operational
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {service.counters.map((counter) => (
                  <div
                    key={counter.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">
                          {counter.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Available to the shared staff console
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          counter.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {counter.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={updatingId === counter.id}
                      onClick={() =>
                        void toggleCounter(counter.id, !counter.isActive)
                      }
                      className={`mt-4 w-full rounded-lg px-3 py-2 text-xs font-bold transition ${
                        counter.isActive
                          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {counter.isActive ? "Disable counter" : "Enable counter"}
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {section === "staff" && (
        <div className="space-y-5">
          <form
            onSubmit={submitStaffMember}
            className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Add staff member
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Create a staff login and optionally assign counters immediately.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="text-sm font-semibold text-slate-700">
                Full name
                <input
                  required
                  value={staffForm.fullName}
                  onChange={(event) =>
                    setStaffForm((value) => ({
                      ...value,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Rahul Kumar"
                  className="mt-1.5 w-full rounded-xl border border-white bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Staff email
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="email"
                    value={staffForm.email}
                    onChange={(event) =>
                      setStaffForm((value) => ({
                        ...value,
                        email: event.target.value,
                      }))
                    }
                    placeholder="staff@campusflow.local"
                    className="w-full rounded-xl border border-white bg-white py-2.5 pl-9 pr-3 font-normal outline-none focus:border-violet-400"
                  />
                </div>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Temporary password
                <div className="relative mt-1.5">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={staffForm.password}
                    onChange={(event) =>
                      setStaffForm((value) => ({
                        ...value,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-white bg-white py-2.5 pl-9 pr-3 font-normal outline-none focus:border-violet-400"
                  />
                </div>
              </label>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-slate-700">
                Initial counter assignments
              </p>
              <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {allCounters.map((counter) => (
                  <label
                    key={counter.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/80 p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={staffForm.counterIds.includes(counter.id)}
                      onChange={(event) =>
                        setStaffForm((value) => ({
                          ...value,
                          counterIds: event.target.checked
                            ? [...value.counterIds, counter.id]
                            : value.counterIds.filter(
                                (counterId) => counterId !== counter.id,
                              ),
                        }))
                      }
                      className="mt-0.5 h-4 w-4 accent-violet-600"
                    />
                    <span>
                      <strong className="block text-slate-900">
                        {counter.label}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {counter.serviceTitle}
                        {counter.staff
                          ? ` · currently ${counter.staff.fullName}`
                          : " · unassigned"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingId === "create-staff"}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {updatingId === "create-staff"
                ? "Creating account..."
                : "Create staff account"}
            </button>
          </form>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(adminData?.staff ?? []).map((member) => (
              <article
                key={member.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      member.isActive
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <UsersRound className="h-6 w-6" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                      member.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {member.isActive ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-extrabold text-slate-950">
                  {member.fullName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{member.email}</p>

                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Counter assignments
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {member.assignedCounters.map((counter) => (
                      <span
                        key={counter.id}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          counter.isActive
                            ? "bg-violet-50 text-violet-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {counter.service.title} · {counter.label}
                      </span>
                    ))}
                    {member.assignedCounters.length === 0 && (
                      <span className="text-xs text-amber-700">
                        No counters assigned
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    {member.role}
                  </span>
                  {member.role === "STAFF" ? (
                    <button
                      type="button"
                      disabled={updatingId === member.id}
                      onClick={() =>
                        void toggleStaffMember(member.id, !member.isActive)
                      }
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                        member.isActive
                          ? "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {member.isActive ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      {member.isActive ? "Disable" : "Enable"}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      Protected admin
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {section === "analytics" && (
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold text-slate-950">Visitors Over Time</h2><p className="mt-1 text-xs text-slate-500">Queue joins by hour today</p><div className="mt-4"><LineChart points={analytics?.visitorsOverTime ?? []} /></div></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold text-slate-950">Top Services by Visits</h2><p className="mt-1 text-xs text-slate-500">Distribution over the last seven days</p><div className="mt-7"><DonutChart services={analytics?.topServices ?? []} /></div></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold text-slate-950">Average Wait Time Trend</h2><p className="mt-1 text-xs text-slate-500">Minutes from joining to being called</p><div className="mt-4"><LineChart points={analytics?.averageWaitTrend ?? []} suffix="m" /></div></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold text-slate-950">Peak Hours</h2><p className="mt-1 text-xs text-slate-500">Busiest queue-entry windows today</p><div className="mt-7"><PeakHoursChart points={analytics?.peakHours ?? []} /></div></article>
        </div>
      )}

      {section === "logs" && (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5"><ScrollText className="h-5 w-5 text-violet-600" /><h2 className="font-extrabold text-slate-950">Recent queue events</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Token</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Service</th><th className="px-5 py-3">Event</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{(analytics?.logs ?? []).map((log) => <tr key={log.id} className="border-t border-slate-100"><td className="px-5 py-4 font-black text-violet-700">{log.tokenLabel}</td><td className="px-5 py-4 font-semibold">{log.studentName}</td><td className="px-5 py-4 text-slate-600">{log.serviceTitle}</td><td className="px-5 py-4 text-slate-600">{log.message}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[log.status]}`}>{log.status}</span></td></tr>)}</tbody></table></div>
        </article>
      )}

      {section === "settings" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Settings className="h-6 w-6 text-violet-600" /><h2 className="text-lg font-extrabold">Service availability</h2></div><div className="mt-5 space-y-3">{(adminData?.services ?? []).map((service) => <div key={service.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-950">{service.title}</p><p className="text-xs text-slate-500">{service.department}</p></div><button type="button" onClick={() => void toggleService(service.id, !service.isOpen)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${service.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{service.isOpen ? "Open" : "Closed"}</button></div>)}</div></article>
          <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-sm"><SlidersHorizontal className="h-7 w-7 text-violet-600" /><h2 className="mt-4 text-xl font-extrabold text-slate-950">System defaults</h2><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between rounded-xl bg-white/75 p-4"><span className="text-slate-500">Queue refresh</span><strong>Manual + live API</strong></div><div className="flex justify-between rounded-xl bg-white/75 p-4"><span className="text-slate-500">Total services</span><strong>{adminData?.services.length ?? 0}</strong></div><div className="flex justify-between rounded-xl bg-white/75 p-4"><span className="text-slate-500">Total counters</span><strong>{totalCounters}</strong></div></div></article>
        </div>
      )}

      {section === "profile" && (
        <article className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700"><CircleUserRound className="h-8 w-8" /></div><h2 className="mt-5 text-2xl font-extrabold text-slate-950">{user.fullName}</h2><p className="mt-1 text-slate-500">{user.email}</p><div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase text-slate-400">Role</p><p className="mt-1 font-bold">{user.role}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase text-slate-400">Departments</p><p className="mt-1 font-bold">{adminData?.departments.length ?? 0}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase text-slate-400">Staff</p><p className="mt-1 font-bold">{adminData?.staff.length ?? 0}</p></div></div></article>
      )}
    </OperationsPageShell>
  );
}

export default AdminSectionPage;
