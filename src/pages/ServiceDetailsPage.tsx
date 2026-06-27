import {
  ArrowLeft,
  Clock3,
  LogOut,
  Monitor,
  RefreshCw,
  TicketCheck,
  Users,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router";

import {
  cancelQueue,
  getMyActiveQueue,
  joinQueue,
} from "../api/queue-api";
import { getServiceById } from "../api/service-api";
import StudentPageShell from "../components/dashboard/StudentPageShell";
import JoinQueueModal from "../components/queue/JoinQueueModal";
import ServiceIcon from "../components/services/ServiceIcon";
import type { AuthUser } from "../types/auth";
import type { StudentQueue } from "../types/queue";
import type { CampusService } from "../types/service";

type ServiceDetailsPageProps = {
  user: AuthUser;
};

type JoinQueueDetails = {
  reason: string;
  note: string;
};

type RequestStatus =
  | "loading"
  | "success"
  | "error";

function ServiceDetailsPage({
  user,
}: ServiceDetailsPageProps) {
  const { serviceId } = useParams();
  const [service, setService] =
    useState<CampusService | null>(null);
  const [activeQueue, setActiveQueue] =
    useState<StudentQueue | null>(null);
  const [requestStatus, setRequestStatus] =
    useState<RequestStatus>("loading");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [actionError, setActionError] =
    useState("");
  const [requestNumber, setRequestNumber] =
    useState(0);
  const [isJoinModalOpen, setIsJoinModalOpen] =
    useState(false);
  const [isCancelling, setIsCancelling] =
    useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadServicePage() {
      if (!serviceId) {
        setRequestStatus("error");
        setErrorMessage(
          "The service ID is missing.",
        );
        return;
      }

      try {
        setRequestStatus("loading");
        setErrorMessage("");
        setActionError("");

        const [serviceData, queueData] =
          await Promise.all([
            getServiceById(
              serviceId,
              controller.signal,
            ),
            getMyActiveQueue(
              controller.signal,
            ),
          ]);

        setService(serviceData);
        setActiveQueue(queueData);
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
            : "Unable to load the selected service.",
        );
      }
    }

    void loadServicePage();

    return () => controller.abort();
  }, [serviceId, requestNumber]);

  async function handleJoinQueue(
    details: JoinQueueDetails,
  ) {
    if (!service) {
      throw new Error(
        "The selected service is unavailable.",
      );
    }

    const queue = await joinQueue({
      serviceId: service.id,
      reason: details.reason,
      note: details.note,
    });

    setActiveQueue(queue);
    setIsJoinModalOpen(false);
    setActionError("");
    setRequestNumber(
      (currentNumber) => currentNumber + 1,
    );
  }

  async function handleLeaveQueue() {
    if (!activeQueue) {
      return;
    }

    const shouldLeave = window.confirm(
      `Leave token ${activeQueue.tokenLabel}?`,
    );

    if (!shouldLeave) {
      return;
    }

    try {
      setIsCancelling(true);
      setActionError("");
      await cancelQueue(activeQueue.id);
      setActiveQueue(null);
      setRequestNumber(
        (currentNumber) => currentNumber + 1,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to leave the queue.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  if (requestStatus === "loading") {
    return (
      <StudentPageShell
        user={user}
        eyebrow="Campus Services"
        title="Loading service..."
      >
        <div className="h-[520px] animate-pulse rounded-3xl border border-gray-200 bg-white" />
      </StudentPageShell>
    );
  }

  if (requestStatus === "error" || !service) {
    return (
      <StudentPageShell
        user={user}
        eyebrow="Campus Services"
        title="Service unavailable"
      >
        <section className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-600">
            Unable to load this service
          </p>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Please try again
          </h2>
          <p className="mt-3 leading-7 text-gray-600">
            {errorMessage}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                setRequestNumber(
                  (currentNumber) =>
                    currentNumber + 1,
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              to="/services"
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to services
            </Link>
          </div>
        </section>
      </StudentPageShell>
    );
  }

  const queueForThisService =
    activeQueue?.service.id === service.id
      ? activeQueue
      : null;
  const queueForAnotherService =
    activeQueue && !queueForThisService
      ? activeQueue
      : null;

  return (
    <StudentPageShell
      user={user}
      eyebrow="Campus Services"
      title={service.title}
    >
      <Link
        to="/services"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-violet-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to services
      </Link>

      {actionError && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {actionError}
        </p>
      )}

      <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <ServiceIcon
                  iconKey={service.iconKey}
                  className="h-7 w-7"
                />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                  {service.department}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {service.title}
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                  {service.description}
                </p>
              </div>
            </div>

            <span
              className={`self-start rounded-full px-4 py-2 text-sm font-semibold ${
                service.isOpen
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {service.isOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          <div className="rounded-2xl bg-gray-50 p-5">
            <Clock3 className="h-6 w-6 text-violet-600" />
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {service.isOpen
                ? `${service.waitTime} minutes`
                : "—"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Estimated wait time
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <Users className="h-6 w-6 text-violet-600" />
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {service.peopleWaiting} students
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Currently active
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <Monitor className="h-6 w-6 text-violet-600" />
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {service.activeCounters} counters
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Currently available
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 sm:p-8">
          {queueForThisService ? (
            <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                    Your active token
                  </p>
                  <p className="mt-2 text-5xl font-bold text-violet-950">
                    {queueForThisService.tokenLabel}
                  </p>
                  <p className="mt-3 font-semibold text-gray-900">
                    {queueForThisService.reason}
                  </p>
                  {queueForThisService.note && (
                    <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                      {queueForThisService.note}
                    </p>
                  )}
                  <p className="mt-4 text-sm font-semibold text-violet-800">
                    Status: {" "}
                    {queueForThisService.status}
                    {queueForThisService.counterLabel
                      ? ` · ${queueForThisService.counterLabel}`
                      : ""}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                  <div className="rounded-2xl bg-white p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {queueForThisService.peopleAhead}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Ahead of you
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {queueForThisService.estimatedWait}m
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Estimated wait
                    </p>
                  </div>
                </div>
              </div>

              {queueForThisService.nowServingToken && (
                <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-violet-800">
                  Now serving: {" "}
                  {queueForThisService.nowServingToken}
                </p>
              )}

              {(queueForThisService.status ===
                "WAITING" ||
                queueForThisService.status ===
                  "CALLED") && (
                <div className="mt-6 border-t border-violet-200 pt-6">
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => {
                      void handleLeaveQueue();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {isCancelling
                      ? "Leaving..."
                      : "Leave queue"}
                  </button>
                </div>
              )}
            </div>
          ) : queueForAnotherService ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <TicketCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
                <div>
                  <h3 className="font-bold text-amber-950">
                    You already have an active queue
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    Token {queueForAnotherService.tokenLabel} is active for {" "}
                    {queueForAnotherService.service.title}.
                    Leave that queue before joining
                    another service.
                  </p>
                  <Link
                    to={`/services/${queueForAnotherService.service.id}`}
                    className="mt-4 inline-flex rounded-xl bg-amber-900 px-5 py-3 text-sm font-semibold text-white"
                  >
                    View active queue
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
                <p className="font-semibold text-violet-950">
                  Before joining
                </p>
                <p className="mt-2 text-sm leading-6 text-violet-800">
                  Keep the required documents ready
                  and remain available when your
                  token is close to being called.
                </p>
              </div>

              <button
                type="button"
                disabled={!service.isOpen}
                onClick={() =>
                  setIsJoinModalOpen(true)
                }
                className="mt-6 w-full rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:w-auto"
              >
                {service.isOpen
                  ? "Join Queue"
                  : "Service Closed"}
              </button>
            </>
          )}
        </div>
      </section>

      <JoinQueueModal
        serviceTitle={service.title}
        reasons={service.reasons}
        isOpen={isJoinModalOpen}
        onClose={() =>
          setIsJoinModalOpen(false)
        }
        onConfirm={handleJoinQueue}
      />
    </StudentPageShell>
  );
}

export default ServiceDetailsPage;
