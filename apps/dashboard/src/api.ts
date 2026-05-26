import { Induction, InductionRecord, UserPreferences } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8551/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchInductions(): Promise<Induction[]> {
  const response = await fetch(`${BASE_URL}/inductions`);
  return handleResponse<Induction[]>(response);
}

export async function fetchInductionRecords(
  inductionId: string,
  options: {
    status: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  }
): Promise<InductionRecord[]> {
  const url = new URL(`${BASE_URL}/inductions/${inductionId}/records`);

  if (options.status && options.status !== "all") {
    url.searchParams.set("status", options.status);
  }
  if (options.search) {
    url.searchParams.set("search", options.search);
  }
  if (options.sortBy) {
    url.searchParams.set("sortBy", options.sortBy);
  }
  if (options.sortOrder) {
    url.searchParams.set("sortOrder", options.sortOrder);
  }

  const response = await fetch(url.toString());
  return handleResponse<InductionRecord[]>(response);
}

export async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await fetch(`${BASE_URL}/user-preferences`);
  return handleResponse<UserPreferences>(response);
}

export async function saveUserPreferences(
  preferences: UserPreferences
): Promise<UserPreferences> {
  const response = await fetch(`${BASE_URL}/user-preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
  });

  return handleResponse<UserPreferences>(response);
}
