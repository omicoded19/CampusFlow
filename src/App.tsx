import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { getServices } from "./api/service-api";
import Header from "./components/layout/Header";
import ServiceCard from "./components/services/ServiceCard";
import { getServiceIcon } from "./lib/service-icons";
import type { CampusService } from "./types/service";

type RequestStatus = "loading" | "success" | "error";

function App() {
  const [services, setServices] = useState<CampusService[]>([]);
  const [requestStatus, setRequestStatus] =
    useState<RequestStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadServices() {
      try {
        const serviceData = await getServices(controller.signal);

        setServices(serviceData);
        setRequestStatus("success");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setServices([]);
        setRequestStatus("error");

        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unable to load campus services.");
        }
      }
    }

    loadServices();

    return () => {
      controller.abort();
    };
  }, [requestNumber]);

  function retryLoadingServices() {
    setRequestStatus("loading");
    setErrorMessage("");
    setRequestNumber((currentNumber) => currentNumber + 1);
  }

  const totalActiveCounters = services.reduce(
    (total, service) => total + service.activeCounters,
    0,
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Header />

      <main>
        <section className="px-6 py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Campus services are live
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Skip the line,
                <span className="text-violet-600"> not your turn.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                Join campus service queues remotely, monitor your live
                position, and receive an alert when your turn is approaching.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#services"
                  className="rounded-xl bg-violet-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-violet-700"
                >
                  Explore Services
                </a>

                <button
                  type="button"
                  className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  How it works
                </button>
              </div>

              <div className="mt-10 flex flex-wrap gap-8">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {requestStatus === "success" ? services.length : "—"}
                  </p>
                  <p className="text-sm text-gray-500">Campus services</p>
                </div>

                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {requestStatus === "success"
                      ? totalActiveCounters
                      : "—"}
                  </p>
                  <p className="text-sm text-gray-500">Active counters</p>
                </div>

                <div>
                  <p className="text-2xl font-bold text-gray-900">18 min</p>
                  <p className="text-sm text-gray-500">Average saved time</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/60 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-violet-600">
                    Your active queue
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-gray-900">
                    Document Verification
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Academic Office · Counter 2
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live
                </span>
              </div>

              <div className="my-8 flex justify-center">
                <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-[12px] border-violet-100 bg-violet-600 text-white shadow-lg shadow-violet-200">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-100">
                    Token
                  </p>

                  <p className="mt-1 text-5xl font-bold">A-26</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-xl font-bold text-gray-900">A-19</p>
                  <p className="mt-1 text-xs text-gray-500">Now serving</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-xl font-bold text-gray-900">6</p>
                  <p className="mt-1 text-xs text-gray-500">Ahead of you</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-xl font-bold text-gray-900">18m</p>
                  <p className="mt-1 text-xs text-gray-500">Estimated</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-sm font-medium text-violet-800">
                  We will notify you when only two students are ahead.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="border-t border-gray-200 bg-white px-6 py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
                  Campus services
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Choose a service
                </h2>

                <p className="mt-3 max-w-2xl text-gray-600">
                  Check current waiting times and join an available service
                  queue remotely.
                </p>
              </div>

              <button
                type="button"
                onClick={retryLoadingServices}
                disabled={requestStatus === "loading"}
                className="inline-flex self-start items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    requestStatus === "loading" ? "animate-spin" : ""
                  }`}
                />
                Refresh services
              </button>
            </div>

            {requestStatus === "loading" && (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <div className="flex justify-between">
                      <div className="h-12 w-12 rounded-xl bg-gray-200" />
                      <div className="h-7 w-16 rounded-full bg-gray-200" />
                    </div>

                    <div className="mt-5 h-4 w-28 rounded bg-gray-200" />
                    <div className="mt-3 h-6 w-48 rounded bg-gray-200" />

                    <div className="mt-3 h-4 w-full rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-4/5 rounded bg-gray-200" />

                    <div className="mt-5 h-20 rounded-xl bg-gray-200" />
                    <div className="mt-5 h-12 rounded-xl bg-gray-200" />
                  </div>
                ))}
              </div>
            )}

            {requestStatus === "error" && (
              <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-red-600" />

                <h3 className="mt-4 text-xl font-bold text-red-950">
                  Unable to load campus services
                </h3>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-700">
                  {errorMessage}
                </p>

                <p className="mt-3 text-sm text-red-700">
                  Make sure the Express backend is running on port 4000.
                </p>

                <button
                  type="button"
                  onClick={retryLoadingServices}
                  className="mt-6 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  Try again
                </button>
              </div>
            )}

            {requestStatus === "success" && services.length === 0 && (
              <div className="mt-10 rounded-3xl border border-gray-200 bg-gray-50 p-10 text-center">
                <h3 className="text-xl font-bold text-gray-900">
                  No services available
                </h3>

                <p className="mt-2 text-gray-600">
                  Campus services have not been added yet.
                </p>
              </div>
            )}

            {requestStatus === "success" && services.length > 0 && (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
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
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;