import type {
  StaffAnalyticsResponse,
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


export async function getStaffAnalytics(signal?: AbortSignal) {
  const response = await fetch(`${apiUrl}/api/staff/analytics`, {
    credentials: "include",
    signal,
    headers: { Accept: "application/json" },
  });

  const result = await readJson<StaffAnalyticsResponse | StaffErrorResponse>(response);

  if (!response.ok || !result.success) {
    if (!result.success) {
      throw new Error(result.error.message);
    }

    throw new Error("Unable to load CampusFlow analytics.");
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

export async function transferQueueEntry(queueId: string, serviceId: string) {
  const response = await fetch(
    `${apiUrl}/api/staff/queues/${encodeURIComponent(queueId)}/transfer`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ serviceId }),
    },
  );

  const result = await readJson<StaffMessageResponse | StaffErrorResponse>(response);

  if (!response.ok || !result.success) {
    if (!result.success) throw new Error(result.error.message);
    throw new Error("Unable to transfer the queue entry.");
  }
}

export async function getAdminData(signal?: AbortSignal) {
  const response = await fetch(`${apiUrl}/api/staff/admin-data`, {
    credentials: "include",
    signal,
    headers: { Accept: "application/json" },
  });

  const result = await readJson<
    import("../types/staff").AdminDataResponse | StaffErrorResponse
  >(response);

  if (!response.ok || !result.success) {
    if (!result.success) throw new Error(result.error.message);
    throw new Error("Unable to load admin data.");
  }

  return result.data;
}

export async function updateServiceAvailability(serviceId: string, isOpen: boolean) {
  const response = await fetch(
    `${apiUrl}/api/staff/services/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ isOpen }),
    },
  );

  const result = await readJson<StaffMessageResponse | StaffErrorResponse>(response);
  if (!response.ok || !result.success) {
    if (!result.success) throw new Error(result.error.message);
    throw new Error("Unable to update service availability.");
  }
}

export async function updateCounterAvailability(counterId: string, isActive: boolean) {
  const response = await fetch(
    `${apiUrl}/api/staff/counters/${encodeURIComponent(counterId)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ isActive }),
    },
  );

  const result = await readJson<StaffMessageResponse | StaffErrorResponse>(response);
  if (!response.ok || !result.success) {
    if (!result.success) throw new Error(result.error.message);
    throw new Error("Unable to update counter availability.");
  }
}
