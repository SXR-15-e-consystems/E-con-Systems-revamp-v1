import { AxiosError } from "axios";
import { apiClient } from "./client";
import type { NavigationConfig, NavigationUpdate } from "../types/navigation";

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail =
      error.response?.data?.error?.message ?? error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (error.message) return error.message;
  }
  return "An unexpected error occurred.";
}

class ApiError extends Error {
  public readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function fetchNavigation(): Promise<NavigationConfig> {
  try {
    const { data } = await apiClient.get<NavigationConfig>("/cms/navigation");
    return data;
  } catch (error) {
    throw new ApiError(
      extractErrorMessage(error),
      (error as AxiosError)?.response?.status,
    );
  }
}

export async function updateNavigation(
  payload: NavigationUpdate,
): Promise<NavigationConfig> {
  try {
    const { data } = await apiClient.put<NavigationConfig>(
      "/cms/navigation",
      payload,
    );
    return data;
  } catch (error) {
    throw new ApiError(
      extractErrorMessage(error),
      (error as AxiosError)?.response?.status,
    );
  }
}

export async function publishNavigation(): Promise<NavigationConfig> {
  try {
    const { data } = await apiClient.post<NavigationConfig>(
      "/cms/navigation/publish",
    );
    return data;
  } catch (error) {
    throw new ApiError(
      extractErrorMessage(error),
      (error as AxiosError)?.response?.status,
    );
  }
}
