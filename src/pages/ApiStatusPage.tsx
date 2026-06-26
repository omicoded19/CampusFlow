import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { Link } from "react-router";

import Header from "../components/layout/Header";

type HealthResponse = {
  success: boolean;
  data: {
    service: string;
    status: string;
    environment: string;
    timestamp: string;
    uptimeSeconds: number;
  };
};

type RequestStatus = "loading" | "success" | "error";

const apiUrl =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function ApiStatusPage() {
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [healthData, setHealthData] =
    useState<HealthResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        setStatus("loading");
        setErrorMessage("");

        const response = await fetch(`${apiUrl}/api/health`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Backend returned status ${response.status}`,
          );
        }

        const result =
          (await response.json()) as HealthResponse;

        setHealthData(result);
        setStatus("success");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setHealthData(null);
        setStatus("error");

        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unable to connect to the backend.");
        }
      }
    }

    checkBackend();

    return () => {
      controller.abort();
    };
  }, [requestNumber]);

  function refreshStatus() {
    setRequestNumber((currentNumber) => currentNumber + 1);
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Header />

      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-violet-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Return home
          </Link>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Server className="h-6 w-6" />
                </div>

                <h1 className="mt-5 text-3xl font-bold text-gray-900">
                  Backend connection
                </h1>

                <p className="mt-3 leading-7 text-gray-600">
                  This page sends a request from the React frontend to
                  the Express backend.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshStatus}
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    status === "loading" ? "animate-spin" : ""
                  }`}
                />
                Refresh status
              </button>
            </div>

            {status === "loading" && (
              <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-violet-600" />

                  <p className="font-semibold text-violet-900">
                    Connecting to CampusFlow API...
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

                  <div>
                    <p className="font-semibold text-red-900">
                      Backend connection failed
                    </p>

                    <p className="mt-2 text-sm leading-6 text-red-700">
                      {errorMessage}
                    </p>

                    <p className="mt-3 text-sm text-red-700">
                      Make sure the backend is running on:
                    </p>

                    <code className="mt-2 block rounded-lg bg-white px-3 py-2 text-sm text-red-700">
                      {apiUrl}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {status === "success" && healthData && (
              <div className="mt-8">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />

                    <div>
                      <p className="font-semibold text-emerald-900">
                        Frontend and backend are connected
                      </p>

                      <p className="mt-2 text-sm leading-6 text-emerald-700">
                        React successfully received JSON data from the
                        Express API.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {healthData.data.service}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="mt-2 text-lg font-bold capitalize text-gray-900">
                      {healthData.data.status}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">
                      Environment
                    </p>
                    <p className="mt-2 text-lg font-bold capitalize text-gray-900">
                      {healthData.data.environment}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">
                      Backend uptime
                    </p>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {healthData.data.uptimeSeconds} seconds
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-800">
                    JSON received from backend
                  </p>

                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-gray-950 p-5 text-sm leading-6 text-gray-100">
                    {JSON.stringify(healthData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default ApiStatusPage;