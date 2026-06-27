import type {
  ActiveQueueResponse,
  JoinQueueInput,
  JoinQueueResponse,
  QueueErrorResponse,
  QueueHistoryResponse,
  QueueMessageResponse,
  StudentQueue,
} from "../types/queue";

const apiUrl =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000";

async function readJson<T>(response: Response) {
  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      "The server returned an invalid response.",
    );
  }

  return (await response.json()) as T;
}

function getQueueError(result: QueueErrorResponse) {
  return (
    result.error.message ||
    "Unable to complete the queue request."
  );
}

export async function getMyActiveQueue(
  signal?: AbortSignal,
): Promise<StudentQueue | null> {
  const response = await fetch(
    `${apiUrl}/api/queues/me/active`,
    {
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await readJson<
    ActiveQueueResponse | QueueErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(getQueueError(result));
    }

    throw new Error(
      "Unable to load your active queue.",
    );
  }

  return result.data.queue;
}

export async function getMyQueueHistory(
  signal?: AbortSignal,
) {
  const response = await fetch(
    `${apiUrl}/api/queues/me/history`,
    {
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await readJson<
    QueueHistoryResponse | QueueErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(getQueueError(result));
    }

    throw new Error(
      "Unable to load your queue history.",
    );
  }

  return result.data;
}

export async function joinQueue(
  input: JoinQueueInput,
): Promise<StudentQueue> {
  const response = await fetch(
    `${apiUrl}/api/queues`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  const result = await readJson<
    JoinQueueResponse | QueueErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(getQueueError(result));
    }

    throw new Error("Unable to join this queue.");
  }

  return result.data.queue;
}

export async function cancelQueue(
  queueId: string,
): Promise<void> {
  const response = await fetch(
    `${apiUrl}/api/queues/${encodeURIComponent(
      queueId,
    )}/cancel`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await readJson<
    QueueMessageResponse | QueueErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(getQueueError(result));
    }

    throw new Error("Unable to leave the queue.");
  }
}
