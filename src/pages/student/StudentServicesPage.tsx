import {
  AlertCircle,
  RefreshCw,
  Search,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type RequestStatus = "loading" | "success" | "error";

function StudentServicesPage({ user }: StudentServicesPageProps) {
  const [services, setServices] = useState<CampusService[]>([]);
  const [activeQueue, setActiveQueue] = useState<StudentQueue | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadServices() {
      try {
        setRequestStatus("loading");
        setErrorMessage("");

        const [serviceData, queueData] = await Promise.all([
          getServices(controller.signal),
          getMyActiveQueue(controller.signal),
        ]);

        setServices(serviceData);
        setActiveQueue(queueData);
        setRequestStatus("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setRequestStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load campus services.");
      }
    }

    void loadServices();
    return () => controller.abort();
  }, [requestNumber]);

  const visibleServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return services;
    }

    return services.filter((service) =>
      [service.title, service.department, service.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, services]);

  return (
    <StudentPageShell
      user={user}
      eyebrow="Student Portal"
      title={`Hello, ${user.fullName.split(" ")[0] ?? user.fullName} 👋`}
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              <Sparkles className="h-4 w-4" />
              Campus services
            </div>
            <h2 className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-950">
              How can we help you today?
            </h2>
          </div>

          <button
            type="button"
            disabled={requestStatus === "loading"}
            onClick={() => setRequestNumber((currentNumber) => currentNumber + 1)}
            className="inline-flex self-start items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 lg:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${requestStatus === "loading" ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for services, departments..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />
        </div>
      </section>

      {activeQueue && (
        <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
              <TicketCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-violet-950">Your active token: {activeQueue.tokenLabel}</p>
              <p className="mt-1 text-sm text-violet-800">
                {activeQueue.service.title} · {activeQueue.peopleAhead} ahead · {activeQueue.estimatedWait} min
              </p>
            </div>
          </div>

          <Link
            to={`/services/${activeQueue.service.id}`}
            className="rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Open My Queue
          </Link>
        </section>
      )}

      <div className="mt-7 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">Popular Services</h2>
          <p className="mt-1 text-sm text-slate-500">
            {visibleServices.length} {visibleServices.length === 1 ? "service" : "services"} available
          </p>
        </div>
      </div>

      {requestStatus === "loading" && (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[248px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      )}

      {requestStatus === "error" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
          <h3 className="mt-4 text-xl font-bold text-red-950">Unable to load services</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-700">{errorMessage}</p>
        </div>
      )}

      {requestStatus === "success" && visibleServices.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Search className="mx-auto h-9 w-9 text-slate-400" />
          <h3 className="mt-3 font-bold text-slate-900">No services found</h3>
          <p className="mt-1 text-sm text-slate-500">Try another department or service name.</p>
        </div>
      )}

      {requestStatus === "success" && visibleServices.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleServices.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              icon={getServiceIcon(service.iconKey)}
              department={service.department}
              title={service.title}
              description={service.description}
              waitTime={service.waitTime}
              peopleWaiting={service.peopleWaiting}
              activeCounters={service.activeCounters}
              isOpen={service.isOpen}
            />
          ))}
        </div>
      )}
    </StudentPageShell>
  );
}

export default StudentServicesPage;
