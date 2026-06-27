import {
  ArrowRight,
  BellRing,
  Check,
  Clock3,
  RefreshCw,
  TicketCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { cancelQueue, getMyActiveQueue } from "../../api/queue-api";
import StudentPageShell from "../../components/dashboard/StudentPageShell";
import type { AuthUser } from "../../types/auth";
import type { StudentQueue } from "../../types/queue";

type MyQueuePageProps = {
  user: AuthUser;
};

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

function buildProgressTokens(queue: StudentQueue): ProgressToken[] {
  const current = readTokenParts(queue.tokenLabel);
  const serving = queue.nowServingToken
    ? readTokenParts(queue.nowServingToken)
    : null;
  const inferredServing = Math.max(
    1,
    current.number - queue.peopleAhead - 1,
  );
  const servingNumber = serving?.number ?? inferredServing;
  const start = Math.max(
    1,
    Math.min(servingNumber, current.number - 5),
  );
  const end = Math.max(current.number + 4, start + 9);

  return Array.from(
    { length: end - start + 1 },
    (_, index) => {
      const number = start + index;

      return {
        number,
        label: `${current.prefix}${number}`,
        state:
          number < current.number
            ? "completed"
            : number === current.number
              ? "current"
              : "waiting",
      };
    },
  );
}

function formatJoinTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusCopy(queue: StudentQueue) {
  if (queue.status === "SERVING") {
    return {
      badge: "Service in progress",
      message: "You are currently being served.",
    };
  }

  if (queue.status === "CALLED") {
    return {
      badge: "Token called",
      message: "Please proceed to the assigned counter.",
    };
  }

  if (queue.peopleAhead <= 2) {
    return {
      badge: "Your turn is near",
      message: "Stay nearby and watch for your token call.",
    };
  }

  return {
    badge: "You are in queue",
    message: "Your live position updates as tokens are completed.",
  };
}

function QueueProgress({ queue }: { queue: StudentQueue }) {
  const tokens = useMemo(() => buildProgressTokens(queue), [queue]);
  const currentIndex = Math.max(
    0,
    tokens.findIndex((token) => token.state === "current"),
  );
  const progressWidth =
    tokens.length > 1
      ? `${(currentIndex / (tokens.length - 1)) * 100}%`
      : "0%";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-950">
        Queue progress
      </h2>

      <div className="mt-7 overflow-x-auto pb-2">
        <div className="relative flex min-w-[760px] items-start justify-between">
          <div className="absolute left-5 right-5 top-4 h-0.5 bg-slate-200" />
          <div
            className="absolute left-5 top-4 h-0.5 bg-emerald-400"
            style={{ width: progressWidth }}
          />

          {tokens.map((token) => (
            <div
              key={token.label}
              className="relative z-10 flex w-16 flex-col items-center text-center"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-4 border-white text-xs font-bold shadow-sm ${
                  token.state === "completed"
                    ? "bg-emerald-500 text-white"
                    : token.state === "current"
                      ? "bg-violet-600 text-white ring-4 ring-violet-100"
                      : "bg-slate-300 text-white"
                }`}
              >
                {token.state === "current" ? (
                  "●"
                ) : (
                  <Check
                    className={`h-4 w-4 ${
                      token.state === "waiting"
                        ? "opacity-60"
                        : ""
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-bold ${
                  token.state === "current"
                    ? "text-violet-700"
                    : "text-slate-700"
                }`}
              >
                {token.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-5 text-xs font-medium text-slate-600">
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Completed
        </span>
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-violet-600" />
          Your token
        </span>
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          Waiting
        </span>
      </div>
    </section>
  );
}

function MyQueuePage({ user }: MyQueuePageProps) {
  const [queue, setQueue] = useState<StudentQueue | null>(null);
  const [requestStatus, setRequestStatus] =
    useState<RequestStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshNumber, setRefreshNumber] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQueue() {
      try {
        setRequestStatus("loading");
        setErrorMessage("");
        const queueData = await getMyActiveQueue(controller.signal);
        setQueue(queueData);
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
            : "Unable to load your active queue.",
        );
      }
    }

    void loadQueue();

    return () => controller.abort();
  }, [refreshNumber]);

  async function handleLeaveQueue() {
    if (
      !queue ||
      !window.confirm(`Leave token ${queue.tokenLabel}?`)
    ) {
      return;
    }

    try {
      setIsCancelling(true);
      setErrorMessage("");
      await cancelQueue(queue.id);
      setQueue(null);
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

  const statusCopy = queue ? getStatusCopy(queue) : null;
  const canLeave =
    queue?.status === "WAITING" || queue?.status === "CALLED";

  return (
    <StudentPageShell
      user={user}
      eyebrow="Student Portal"
      title="My Queue"
    >
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          disabled={requestStatus === "loading"}
          onClick={() =>
            setRefreshNumber((currentNumber) => currentNumber + 1)
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              requestStatus === "loading" ? "animate-spin" : ""
            }`}
          />
          Refresh status
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {errorMessage}
        </p>
      )}

      {requestStatus === "loading" && !queue ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-violet-600" />
          <p className="mt-4 font-semibold text-slate-700">
            Loading your live queue...
          </p>
        </section>
      ) : !queue ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <TicketCheck className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-950">
            You are not in a queue
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Choose an available campus service, join remotely, and
            track your token here.
          </p>
          <Link
            to="/services"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Browse services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {queue.service.department}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                  {queue.service.title}
                </h2>
              </div>

              {canLeave && (
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => void handleLeaveQueue()}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {isCancelling ? "Leaving..." : "Leave queue"}
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 text-center">
                <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-violet-600">
                  Your token
                </p>
                <p className="mt-3 text-6xl font-black tracking-tight text-violet-700 sm:text-7xl">
                  {queue.tokenLabel}
                </p>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Joined at {formatJoinTime(queue.joinedAt)}
                </p>
                <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                  {statusCopy?.badge}
                </span>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Live status
                </p>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-center">
                  <p className="text-xs font-semibold text-slate-500">
                    Currently serving
                  </p>
                  <p className="mt-2 text-4xl font-black text-slate-950">
                    {queue.nowServingToken ?? "—"}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <Users className="mx-auto h-5 w-5 text-violet-600" />
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {queue.peopleAhead}
                    </p>
                    <p className="text-xs text-slate-500">
                      People ahead
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <Clock3 className="mx-auto h-5 w-5 text-blue-600" />
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {queue.estimatedWait} min
                    </p>
                    <p className="text-xs text-slate-500">
                      Estimated wait
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">
              <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p className="font-bold">{statusCopy?.message}</p>
                <p className="mt-1 text-violet-700">
                  Refresh this page to fetch the latest live position.
                </p>
              </div>
            </div>
          </section>

          <QueueProgress queue={queue} />
        </div>
      )}
    </StudentPageShell>
  );
}

export default MyQueuePage;
