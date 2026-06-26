import type {
  ApiErrorResponse,
  CampusService,
  ServiceResponse,
  ServicesResponse,
} from "../types/service";

const apiUrl =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function getServices(
  signal?: AbortSignal,
): Promise<CampusService[]> {
  const response = await fetch(`${apiUrl}/api/services`, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  const result = (await response.json()) as
    | ServicesResponse
    | ApiErrorResponse;

  if (!response.ok || !result.success) {
    const message = !result.success
      ? result.error.message
      : "Unable to load campus services.";

    throw new Error(message);
  }

  return result.data.services;
}

export async function getServiceById(
  serviceId: string,
  signal?: AbortSignal,
): Promise<CampusService> {
  const response = await fetch(
    `${apiUrl}/api/services/${encodeURIComponent(serviceId)}`,
    {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = (await response.json()) as
    | ServiceResponse
    | ApiErrorResponse;

  if (!response.ok || !result.success) {
    const message = !result.success
      ? result.error.message
      : "Unable to load the selected service.";

    throw new Error(message);
  }

  return result.data.service;
}