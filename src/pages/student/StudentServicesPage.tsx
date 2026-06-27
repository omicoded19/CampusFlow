import {
  AlertCircle,
  RefreshCw,
  TicketCheck,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router";

import { getMyActiveQueue } from "../../api/queue-api";
import { getServices } from "../../api/service-api";
import StudentPageShell from "../../components/dashboard/StudentPageShell";
import ServiceCard from "../../components/services/ServiceCard";
import { getServiceIcon } from "../../lib/service-icons";
import type { AuthUser } from "../../types/auth";
import type { StudentQueue } from "../../types/queue";
import type { CampusService } from "../../types/service";

type StudentServicesPageProps = {
  user: AuthUser;
};

type RequestStatus =
  | "loading"
  | "success"
  | "error";

function StudentServicesPage({
  user,
}: StudentServicesPageProps) {
  const [services, setServices] =
    useState<CampusService[]>([]);
  const [activeQueue, setActiveQueue] =
    useState<StudentQueue | null>(null);
  const [requestStatus, setRequestStatus] =
    useState<RequestStatus>("loading");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [requestNumber, setRequestNumber] =
    useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadServices() {
      try {
        setRequestStatus("loading");
        setErrorMessage("");

        const [serviceData, queueData] =
          await Promise.all([
            getServices(controller.signal),
            getMyActiveQueue(controller.signal),
          ]);

        setServices(serviceData);
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
            : "Unable to load campus services.",
        );
      }
    }

    void loadServices();

    return () => controller.abort();
  }, [requestNumber]);

  return (
    <StudentPageShell
      user={user}
      eyebrow="Student Portal"
      title="Campus Services"
    >
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
            Live campus queues
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            Choose the service you need
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600">
            Compare current wait times, view service
            details, and join one active queue at a
            time.
          </p>
        </div>

        <button
          type="button"
          disabled={requestStatus === "loading"}
          onClick={() =>
            setRequestNumber(
              (currentNumber) =>
                currentNumber + 1,
            )
          }
          className="inline-flex self-start items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              requestStatus === "loading"
                ? "animate-spin"
                : ""
            }`}
          />
          Refresh queues
        </button>
      </section>

      {activeQueue && (
        <section className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600">
              <TicketCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-violet-950">
                Active token {activeQueue.tokenLabel}
              </p>
              <p className="mt-1 text-sm text-violet-800">
                {activeQueue.service.title} · {" "}
                {activeQueue.peopleAhead} ahead · {" "}
                {activeQueue.estimatedWait} min
              </p>
            </div>
          </div>

          <Link
            to={`/services/${activeQueue.service.id}`}
            className="rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            View active queue
          </Link>
        </section>
      )}

      {requestStatus === "loading" && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ),
          )}
        </div>
      )}

      {requestStatus === "error" && (
        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
          <h3 className="mt-4 text-xl font-bold text-red-950">
            Unable to load services
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-700">
            {errorMessage}
          </p>
        </div>
      )}

      {requestStatus === "success" && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              icon={getServiceIcon(
                service.iconKey,
              )}
              department={service.department}
              title={service.title}
              description={service.description}
              waitTime={service.waitTime}
              peopleWaiting={
                service.peopleWaiting
              }
              activeCounters={
                service.activeCounters
              }
              isOpen={service.isOpen}
            />
          ))}
        </div>
      )}
    </StudentPageShell>
  );
}

export default StudentServicesPage;
