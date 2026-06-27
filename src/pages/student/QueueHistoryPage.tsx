import {
  CalendarClock,
  RefreshCw,
  TicketCheck,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router";

import { getMyQueueHistory } from "../../api/queue-api";
import StudentPageShell from "../../components/dashboard/StudentPageShell";
import type { AuthUser } from "../../types/auth";
import type {
  QueueStatus,
  StudentQueue,
} from "../../types/queue";

type QueueHistoryPageProps = {
  user: AuthUser;
};

const statusStyles: Record<
  QueueStatus,
  string
> = {
  WAITING: "bg-blue-50 text-blue-700",
  CALLED: "bg-amber-50 text-amber-700",
  SERVING: "bg-violet-50 text-violet-700",
  COMPLETED:
    "bg-emerald-50 text-emerald-700",
  SKIPPED: "bg-orange-50 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function QueueHistoryPage({
  user,
}: QueueHistoryPageProps) {
  const [history, setHistory] = useState<
    StudentQueue[]
  >([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [requestNumber, setRequestNumber] =
    useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const data = await getMyQueueHistory(
          controller.signal,
        );
        setHistory(data.history);
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
            : "Unable to load queue history.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();
    return () => controller.abort();
  }, [requestNumber]);

  return (
    <StudentPageShell
      user={user}
      eyebrow="Student Portal"
      title="Queue History"
    >
      <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">
              Your campus visits
            </h2>
            <p className="mt-2 text-gray-600">
              Review active, completed, skipped, and
              cancelled queue tokens.
            </p>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              setRequestNumber(
                (currentNumber) =>
                  currentNumber + 1,
              )
            }
            className="inline-flex self-start items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {errorMessage && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-gray-100"
                />
              ),
            )}
          </div>
        ) : history.length === 0 ? (
          <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center">
            <CalendarClock className="h-10 w-10 text-violet-600" />
            <h3 className="mt-4 text-lg font-bold text-gray-950">
              No queue history yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Your queue visits will appear here.
            </p>
            <Link
              to="/services"
              className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Browse services
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {history.map((entry) => (
              <article
                key={entry.id}
                className="flex flex-col justify-between gap-5 rounded-2xl border border-gray-200 p-5 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <TicketCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-950">
                        {entry.service.title}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[entry.status]}`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {entry.service.department} · {" "}
                      {formatDate(entry.joinedAt)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      {entry.reason}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Token
                  </p>
                  <p className="mt-1 text-2xl font-bold text-violet-700">
                    {entry.tokenLabel}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </StudentPageShell>
  );
}

export default QueueHistoryPage;
