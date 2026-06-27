import {
  Bell,
  BellRing,
  Clock3,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { getMyActiveQueue } from "../../api/queue-api";
import StudentPageShell from "../../components/dashboard/StudentPageShell";
import type { AuthUser } from "../../types/auth";
import type { StudentQueue } from "../../types/queue";

type NotificationsPageProps = {
  user: AuthUser;
};

function NotificationsPage({
  user,
}: NotificationsPageProps) {
  const [queue, setQueue] =
    useState<StudentQueue | null>(null);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const controller = new AbortController();

    getMyActiveQueue(controller.signal)
      .then(setQueue)
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load notifications.",
        );
      });

    return () => controller.abort();
  }, []);

  return (
    <StudentPageShell
      user={user}
      eyebrow="Student Portal"
      title="Notifications"
    >
      {errorMessage && (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <BellRing className="h-6 w-6 text-violet-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-950">
              Queue updates
            </h2>
            <p className="mt-1 text-gray-600">
              Important information about your
              current token appears here.
            </p>
          </div>
        </div>

        {queue ? (
          <div className="mt-8 space-y-4">
            <article className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                <div>
                  <h3 className="font-bold text-violet-950">
                    Token {queue.tokenLabel} is {" "}
                    {queue.status.toLowerCase()}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-violet-800">
                    {queue.status === "CALLED"
                      ? `Proceed to ${queue.counterLabel ?? "the service counter"}.`
                      : queue.status === "SERVING"
                        ? "Your service request is currently being handled."
                        : `${queue.peopleAhead} student${queue.peopleAhead === 1 ? " is" : "s are"} ahead of you.`}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                <div>
                  <h3 className="font-bold text-gray-950">
                    Estimated waiting time
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Approximately {queue.estimatedWait} {" "}
                    minutes for {queue.service.title}.
                  </p>
                </div>
              </div>
            </article>
          </div>
        ) : (
          <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center">
            <Bell className="h-10 w-10 text-gray-400" />
            <h3 className="mt-4 font-bold text-gray-950">
              You are all caught up
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Queue notifications will appear after
              you join a service.
            </p>
          </div>
        )}
      </section>
    </StudentPageShell>
  );
}

export default NotificationsPage;
