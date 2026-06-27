import {
  useState,
  type FormEvent,
} from "react";
import {
  LoaderCircle,
  X,
} from "lucide-react";

type JoinQueueDetails = {
  reason: string;
  note: string;
};

type JoinQueueModalProps = {
  serviceTitle: string;
  reasons: string[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    details: JoinQueueDetails,
  ) => Promise<void>;
};

function JoinQueueModal({
  serviceTitle,
  reasons,
  isOpen,
  onClose,
  onConfirm,
}: JoinQueueModalProps) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  if (!isOpen) {
    return null;
  }

  function resetForm() {
    setReason("");
    setNote("");
    setError("");
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!reason) {
      setError(
        "Please select a reason for your visit.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await onConfirm({
        reason,
        note: note.trim(),
      });

      resetForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to join this queue.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 px-4 py-8"
      onMouseDown={handleClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-queue-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-600">
              Join campus queue
            </p>
            <h2
              id="join-queue-title"
              className="mt-1 text-2xl font-bold text-gray-900"
            >
              {serviceTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Select the purpose of your visit
              before joining the queue.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close join queue form"
            disabled={isSubmitting}
            onClick={handleClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="mt-7"
        >
          <label
            htmlFor="visit-reason"
            className="text-sm font-semibold text-gray-800"
          >
            Reason for visit
          </label>

          <select
            id="visit-reason"
            value={reason}
            disabled={isSubmitting}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-gray-100"
          >
            <option value="">
              Select a reason
            </option>
            {reasons.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label
            htmlFor="visit-note"
            className="mt-5 block text-sm font-semibold text-gray-800"
          >
            Additional note
            <span className="ml-1 font-normal text-gray-400">
              (optional)
            </span>
          </label>

          <textarea
            id="visit-note"
            value={note}
            disabled={isSubmitting}
            onChange={(event) =>
              setNote(event.target.value)
            }
            rows={4}
            maxLength={250}
            placeholder="Mention any useful information for the staff."
            className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-gray-100"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {note.length}/250
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm leading-6 text-amber-900">
              Join only when you can reach the
              service location before your token is
              called.
            </p>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:bg-violet-400"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Confirm and join"
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default JoinQueueModal;
