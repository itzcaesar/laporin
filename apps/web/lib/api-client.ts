// ── lib/api-client.ts ──
// API client with cookie-based token management and auto-refresh on 401

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Token helpers ───────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("laporin_token="))
      ?.split("=")[1] ?? null
  );
}

function setTokens(accessToken: string, role: string): void {
  document.cookie = `laporin_token=${accessToken}; path=/; max-age=${15 * 60}; SameSite=Strict`;
  document.cookie = `laporin_role=${role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
}

function clearTokens(): void {
  document.cookie = "laporin_token=; path=/; max-age=0";
  document.cookie = "laporin_role=; path=/; max-age=0";
}

// ── Base fetcher ─────────────────────────────────────────────────────────

type FetchOptions = RequestInit & { skipAuth?: boolean };

async function request<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = skipAuth ? null : getToken();

  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  if (response.status === 401) {
    // Try refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(path, options); // retry once
    }
    clearTokens();
    // Only redirect if not already on auth pages
    if (typeof window !== 'undefined' && 
        !window.location.pathname.startsWith('/login') && 
        !window.location.pathname.startsWith('/register')) {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  return response.json();
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const { data } = await res.json();
    setTokens(data.accessToken, data.role);
    return true;
  } catch {
    return false;
  }
}

// ── Exported API client ───────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: FetchOptions) =>
    request<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...opts,
    }),

  patch: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...opts,
    }),

  delete: <T>(path: string, opts?: FetchOptions) =>
    request<T>(path, { method: "DELETE", ...opts }),

  setTokens,
  clearTokens,
};
