import type {
  StaffDashboardResponse,
  StaffErrorResponse,
  StaffMessageResponse,
  StaffQueueAction,
} from "../types/staff";

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

export async function getStaffDashboard(
  signal?: AbortSignal,
) {
  const response = await fetch(
    `${apiUrl}/api/staff/dashboard`,
    {
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await readJson<
    StaffDashboardResponse | StaffErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(result.error.message);
    }

    throw new Error(
      "Unable to load the staff dashboard.",
    );
  }

  return result.data;
}

export async function updateQueueStatus(
  queueId: string,
  status: StaffQueueAction,
) {
  const response = await fetch(
    `${apiUrl}/api/staff/queues/${encodeURIComponent(
      queueId,
    )}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  const result = await readJson<
    StaffMessageResponse | StaffErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(result.error.message);
    }

    throw new Error(
      "Unable to update the queue status.",
    );
  }
}
