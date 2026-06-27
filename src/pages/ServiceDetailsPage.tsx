import {
  ArrowLeft,
  Bell,
  Check,
  Clock3,
  Monitor,
  RefreshCw,
  TicketCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { cancelQueue, getMyActiveQueue, joinQueue } from "../api/queue-api";
import { getServiceById } from "../api/service-api";
import StudentPageShell from "../components/dashboard/StudentPageShell";
import JoinQueueModal from "../components/queue/JoinQueueModal";
import ServiceIcon from "../components/services/ServiceIcon";
import { getServiceTheme } from "../lib/service-theme";
import type { AuthUser } from "../types/auth";
import type { StudentQueue } from "../types/queue";
import type { CampusService } from "../types/service";

type ServiceDetailsPageProps = { user: AuthUser };
type JoinQueueDetails = { reason: string; note: string };
type RequestStatus = "loading" | "success" | "error";

type ProgressToken = {
  label: string;
  number: number;
  state: "completed" | "current" | "waiting";
};

function readTokenParts(label: string) {
  const match = label.match(/^(.*?)(\d+)$/);
  return {
    prefix: match?.[1] ?? "A-",
    number: Number(match?.[2] ?? 1),
  };
}

function formatJoinTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildProgressTokens(queue: StudentQueue): ProgressToken[] {
  const current = readTokenParts(queue.tokenLabel);
  const serving = queue.nowServingToken ? readTokenParts(queue.nowServingToken) : null;
  const inferredServing = Math.max(1, current.number - queue.peopleAhead - 1);
  const servingNumber = serving?.number ?? inferredServing;
  const start = Math.max(1, Math.min(servingNumber, current.number - 5));
  const end = Math.max(current.number + 4, start + 9);

  return Array.from({ length: end - start + 1 }, (_, index) => {
    const number = start + index;
    return {
      number,
      label: `${current.prefix}${number}`,
      state: number < current.number ? "completed" : number === current.number ? "current" : "waiting",
    };
  });
}

function QueueProgress({ queue }: { queue: StudentQueue }) {
  const tokens = useMemo(() => buildProgressTokens(queue), [queue]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-extrabold text-slate-950">Queue Progress</h3>
      <div className="mt-7 overflow-x-auto pb-2">
        <div className="relative flex min-w-[760px] items-start justify-between">
          <div className="absolute left-5 right-5 top-4 h-0.5 bg-slate-200" />
          <div
            className="absolute left-5 top-4 h-0.5 bg-emerald-400"
            style={{ width: `${Math.max(0, ((tokens.findIndex((token) => token.state === "current") || 0) / (tokens.length - 1)) * 100)}%` }}
          />

          {tokens.map((token) => (
            <div key={token.label} className="relative z-10 flex w-16 flex-col items-center text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-4 border-white text-xs font-bold shadow-sm ${
                  token.state === "completed"
                    ? "bg-emerald-500 text-white"
                    : token.state === "current"
                      ? "bg-violet-600 text-white ring-4 ring-violet-100"
                      : "bg-slate-300 text-white"
                }`}
              >
                {token.state === "completed" ? <Check className="h-4 w-4" /> : token.state === "current" ? "●" : <Check className="h-4 w-4 opacity-60" />}
              </div>
              <span className={`mt-2 text-xs font-bold ${token.state === "current" ? "text-violet-700" : "text-slate-700"}`}>
                {token.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-5 text-xs font-medium text-slate-600">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Completed</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-violet-600" />Your token</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-300" />Waiting</span>
      </div>
    </section>
  );
}

function ServiceDetailsPage({ user }: ServiceDetailsPageProps) {
  const { serviceId } = useParams();
  const [service, setService] = useState<CampusService | null>(null);
  const [activeQueue, setActiveQueue] = useState<StudentQueue | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notifyNearTurn, setNotifyNearTurn] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadServicePage() {
      if (!serviceId) {
        setRequestStatus("error");
        setErrorMessage("The service ID is missing.");
        return;
      }

      try {
        setRequestStatus("loading");
        setErrorMessage("");
        setActionError("");
        const [serviceData, queueData] = await Promise.all([
          getServiceById(serviceId, controller.signal),
          getMyActiveQueue(controller.signal),
        ]);
        setService(serviceData);
        setActiveQueue(queueData);
        setRequestStatus("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRequestStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load the selected service.");
      }
    }

    void loadServicePage();
    return () => controller.abort();
  }, [serviceId, requestNumber]);

  async function handleJoinQueue(details: JoinQueueDetails) {
    if (!service) throw new Error("The selected service is unavailable.");
    const queue = await joinQueue({ serviceId: service.id, reason: details.reason, note: details.note });
    setActiveQueue(queue);
    setIsJoinModalOpen(false);
    setActionError("");
    setRequestNumber((currentNumber) => currentNumber + 1);
  }

  async function handleLeaveQueue() {
    if (!activeQueue || !window.confirm(`Leave token ${activeQueue.tokenLabel}?`)) return;

    try {
      setIsCancelling(true);
      setActionError("");
      await cancelQueue(activeQueue.id);
      setActiveQueue(null);
      setRequestNumber((currentNumber) => currentNumber + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to leave the queue.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (requestStatus === "loading") {
    return (
      <StudentPageShell user={user} eyebrow="Campus Services" title="Loading service...">
        <div className="h-[560px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </StudentPageShell>
    );
  }

  if (requestStatus === "error" || !service) {
    return (
      <StudentPageShell user={user} eyebrow="Campus Services" title="Service unavailable">
        <section className="rounded-2xl border border-red-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-600">Unable to load this service</p>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">Please try again</h2>
          <p className="mt-3 text-slate-600">{errorMessage}</p>
          <div className="mt-7 flex justify-center gap-3">
            <button type="button" onClick={() => setRequestNumber((value) => value + 1)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white">
              <RefreshCw className="h-4 w-4" />Try again
            </button>
            <Link to="/services" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Back to services</Link>
          </div>
        </section>
      </StudentPageShell>
    );
  }

  const queueForThisService = activeQueue?.service.id === service.id ? activeQueue : null;
  const queueForAnotherService = activeQueue && !queueForThisService ? activeQueue : null;
  const theme = getServiceTheme(service.id);

  return (
    <StudentPageShell user={user} eyebrow="Campus Services" title={service.title}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-600">
          <ArrowLeft className="h-4 w-4" />Back to Services
        </Link>
        {queueForThisService && (queueForThisService.status === "WAITING" || queueForThisService.status === "CALLED") && (
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => void handleLeaveQueue()}
            className="rounded-xl border border-red-400 bg-white px-5 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
          >
            {isCancelling ? "Leaving..." : "Leave Queue"}
          </button>
        )}
      </div>

      {actionError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{actionError}</p>}

      <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${theme.icon}`}>
            <ServiceIcon iconKey={service.iconKey} className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">{service.department}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-950">{service.title}</h2>
              <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${service.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {service.isOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {queueForThisService ? (
        <>
          <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1fr]">
            <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-violet-50 p-6 text-center shadow-sm sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-wide text-violet-700">Your Token</p>
              <p className="mt-3 text-7xl font-black tracking-tight text-violet-600 sm:text-8xl">{queueForThisService.tokenLabel}</p>
              <p className="mt-2 text-sm text-slate-500">Joined at {formatJoinTime(queueForThisService.joinedAt)}</p>
              <span className="mt-5 inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
                {queueForThisService.status === "SERVING" ? "Your service is in progress" : queueForThisService.status === "CALLED" ? "Please approach the counter" : "You are in queue"}
              </span>

              <button
                type="button"
                onClick={() => setNotifyNearTurn((value) => !value)}
                className="mt-6 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700"
              >
                <span className="flex items-center gap-3"><Bell className="h-5 w-5" />Notify me when my turn is near</span>
                <span className={`relative h-6 w-11 rounded-full transition ${notifyNearTurn ? "bg-violet-600" : "bg-slate-300"}`}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${notifyNearTurn ? "left-6" : "left-1"}`} />
                </span>
              </button>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Live Status</p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                <p className="text-xs font-semibold text-slate-500">Currently Serving</p>
                <p className="mt-2 text-4xl font-black text-slate-950">{queueForThisService.nowServingToken ?? "—"}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500">People Ahead</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">{queueForThisService.peopleAhead}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500">Estimated Wait</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">{queueForThisService.estimatedWait} min</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Monitor className="h-5 w-5 text-violet-600" />Counters Active</span>
                <strong className="text-2xl text-violet-700">{service.activeCounters}</strong>
              </div>
            </article>
          </section>

          <div className="mt-5">
            <QueueProgress queue={queueForThisService} />
          </div>
        </>
      ) : (
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <p className="max-w-3xl leading-7 text-slate-600">{service.description}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-violet-50 p-5"><Clock3 className="h-6 w-6 text-violet-600" /><p className="mt-4 text-2xl font-black text-slate-950">{service.isOpen ? `${service.waitTime} min` : "—"}</p><p className="text-sm text-slate-500">Estimated wait</p></div>
              <div className="rounded-xl bg-emerald-50 p-5"><Users className="h-6 w-6 text-emerald-600" /><p className="mt-4 text-2xl font-black text-slate-950">{service.peopleWaiting}</p><p className="text-sm text-slate-500">People waiting</p></div>
              <div className="rounded-xl bg-amber-50 p-5"><Monitor className="h-6 w-6 text-amber-600" /><p className="mt-4 text-2xl font-black text-slate-950">{service.activeCounters}</p><p className="text-sm text-slate-500">Active counters</p></div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8">
            {queueForAnotherService ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-bold text-amber-950">You already have token {queueForAnotherService.tokenLabel}</p>
                <p className="mt-1 text-sm text-amber-800">Leave your {queueForAnotherService.service.title} queue before joining another.</p>
                <Link to={`/services/${queueForAnotherService.service.id}`} className="mt-4 inline-flex rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white">View active queue</Link>
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3"><TicketCheck className="mt-0.5 h-6 w-6 text-violet-600" /><div><h3 className="font-extrabold text-slate-950">Ready to skip the physical line?</h3><p className="mt-1 text-sm text-slate-500">Choose a reason and get your live token immediately.</p></div></div>
                <button type="button" disabled={!service.isOpen} onClick={() => setIsJoinModalOpen(true)} className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                  Join Queue
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <JoinQueueModal
        isOpen={isJoinModalOpen}
        serviceTitle={service.title}
        reasons={service.reasons}
        onClose={() => setIsJoinModalOpen(false)}
        onConfirm={handleJoinQueue}
      />
    </StudentPageShell>
  );
}

export default ServiceDetailsPage;
