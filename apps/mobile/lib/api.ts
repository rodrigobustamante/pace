import { API_BASE_URL } from "@/lib/constants";
import { getRefreshToken, storeTokens, getStoredUserId } from "@/lib/auth";
import { useAuthStore } from "@/store/auth";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE_URL}/api/auth/mobile/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const userId = await getStoredUserId();
  if (userId) {
    await storeTokens(data.accessToken, data.refreshToken, userId);
    useAuthStore.getState().setAccessToken(data.accessToken);
  }

  return data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let accessToken = useAuthStore.getState().accessToken;

  const makeRequest = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-User-Timezone": tz,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await makeRequest(accessToken);

  // Token expired → try refresh once
  if (res.status === 401) {
    const newToken = await refreshTokens();
    if (newToken) {
      res = await makeRequest(newToken);
    }
  }

  if (res.status === 401) {
    useAuthStore.getState().logout().catch(() => undefined);
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Streaming fetch — returns the Response for manual reader consumption */
export async function apiStream(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Timezone": tz,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }

  return res;
}

export { ApiError };
