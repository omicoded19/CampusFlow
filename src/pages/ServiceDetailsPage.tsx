import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  LogOut,
  Monitor,
  RefreshCw,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { getServiceById } from "../api/service-api";
import Header from "../components/layout/Header";
import JoinQueueModal from "../components/queue/JoinQueueModal";
import ServiceIcon from "../components/services/ServiceIcon";
import type { CampusService } from "../types/service";

type JoinedQueueDetails = {
  reason: string;
  note: string;
};

type RequestStatus = "loading" | "success" | "error";

function ServiceDetailsPage() {
  const { serviceId } = useParams();

  const [service, setService] = useState<CampusService | null>(null);

  const [requestStatus, setRequestStatus] =
    useState<RequestStatus>("loading");

  const [errorMessage, setErrorMessage] = useState("");

  const [requestNumber, setRequestNumber] = useState(0);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [joinedQueue, setJoinedQueue] =
    useState<JoinedQueueDetails | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadService() {
      if (!serviceId) {
        setRequestStatus("error");
        setErrorMessage("The service ID is missing.");
        return;
      }

      try {
        setRequestStatus("loading");
        setErrorMessage("");
        setService(null);
        setJoinedQueue(null);
        setIsJoinModalOpen(false);

        const serviceData = await getServiceById(
          serviceId,
          controller.signal,
        );

        setService(serviceData);
        setRequestStatus("success");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setService(null);
        setRequestStatus("error");

        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unable to load the selected service.");
        }
      }
    }

    loadService();

    return () => {
      controller.abort();
    };
  }, [serviceId, requestNumber]);

  function retryLoadingService() {
    setRequestNumber((currentNumber) => currentNumber + 1);
  }

  function handleJoinQueue(details: JoinedQueueDetails) {
    setJoinedQueue(details);
    setIsJoinModalOpen(false);
  }

  function handleLeaveQueue() {
    setJoinedQueue(null);
  }

  if (requestStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#f6f7fb]">
        <Header />

        <main className="px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-violet-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to services
            </Link>

            <section className="mt-6 animate-pulse overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-gray-200" />

                  <div className="flex-1">
                    <div className="h-4 w-36 rounded bg-gray-200" />

                    <div className="mt-4 h-9 w-72 max-w-full rounded bg-gray-200" />

                    <div className="mt-4 h-4 w-full rounded bg-gray-200" />

                    <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 rounded-2xl bg-gray-100"
                  />
                ))}
              </div>

              <div className="border-t border-gray-200 p-6 sm:p-8">
                <div className="h-24 rounded-2xl bg-gray-100" />

                <div className="mt-6 h-12 w-36 rounded-xl bg-gray-200" />
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (requestStatus === "error" || !service) {
    return (
      <div className="min-h-screen bg-[#f6f7fb]">
        <Header />

        <main className="px-6 py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
              Service unavailable
            </p>

            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Unable to load this service
            </h1>

            <p className="mt-3 leading-7 text-gray-600">
              {errorMessage}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={retryLoadingService}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>

              <Link
                to="/"
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Return home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Header />

      <main className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-violet-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>

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

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                      {service.title}
                    </h1>

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
                  Currently waiting
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <Monitor className="h-6 w-6 text-violet-600" />

                <p className="mt-4 text-2xl font-bold text-gray-900">
                  {service.activeCounters} counters
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Currently active
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 sm:p-8">
              {joinedQueue ? (
                <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6 sm:p-8">
                  <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                        Your token
                      </p>

                      <p className="mt-2 text-5xl font-bold text-violet-950">
                        A-26
                      </p>

                      <p className="mt-3 font-semibold text-gray-900">
                        {joinedQueue.reason}
                      </p>

                      {joinedQueue.note && (
                        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                          {joinedQueue.note}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                      <div className="rounded-2xl bg-white p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {service.peopleWaiting}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Ahead of you
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {service.waitTime}m
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Estimated wait
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-violet-200 pt-6">
                    <button
                      type="button"
                      onClick={handleLeaveQueue}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Leave Queue
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
                    <p className="font-semibold text-violet-950">
                      Before joining
                    </p>

                    <p className="mt-2 text-sm leading-6 text-violet-800">
                      Keep the required documents ready and remain
                      available when your token is close to being called.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!service.isOpen}
                    onClick={() => setIsJoinModalOpen(true)}
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
        </div>
      </main>

      <JoinQueueModal
        serviceTitle={service.title}
        reasons={service.reasons}
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onConfirm={handleJoinQueue}
      />
    </div>
  );
}

export default ServiceDetailsPage;