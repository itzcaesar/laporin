// ── lib/api-client.ts ──
// Core API client with automatic token refresh and error handling

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // If NEXT_PUBLIC_API_URL is explicitly set to a non-localhost remote URL, use it
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    // Otherwise, dynamically construct it based on the window's hostname
    // This allows local network testing (e.g., accessing via 192.168.x.x or 10.x.x.x)
    return `${window.location.protocol}//${window.location.hostname}:4000`
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
}

const BASE_URL = getBaseUrl()

// ── Token helpers ─────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof document === 'undefined') return null
  return (
    document.cookie
      .split('; ')
      .find(row => row.startsWith('laporin_token='))
      ?.split('=')[1] ?? null
  )
}

export function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null
  return (
    document.cookie
      .split('; ')
      .find(row => row.startsWith('laporin_refresh='))
      ?.split('=')[1] ?? null
  )
}

function setRefreshToken(token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  document.cookie = `laporin_refresh=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${secure}`
}

function clearRefreshToken(): void {
  document.cookie = 'laporin_refresh=; path=/; max-age=0'
}

export function setAuthCookies(accessToken: string, role: string, refreshToken?: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  document.cookie = `laporin_token=${accessToken}; path=/; max-age=${15 * 60}; SameSite=Strict${secure}`
  document.cookie = `laporin_role=${role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${secure}`
  if (refreshToken) {
    setRefreshToken(refreshToken)
  }
}

export function clearAuthCookies(): void {
  document.cookie = 'laporin_token=; path=/; max-age=0'
  document.cookie = 'laporin_role=; path=/; max-age=0'
  clearRefreshToken()
}

// ── Refresh ───────────────────────────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null

async function doRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      return false
    }

    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const json = await res.json()
    if (json.success) {
      setAuthCookies(json.data.accessToken, json.data.role)
      return true
    }
    return false
  } catch {
    return false
  }
}

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = doRefreshToken()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  return tryRefreshToken()
}

// ── Core fetcher ──────────────────────────────────────────────────────────

type RequestOptions = RequestInit & { skipAuth?: boolean; isRetry?: boolean }

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, isRetry = false, ...fetchOptions } = options
  const token = skipAuth ? null : getToken()

  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
    credentials: 'include',
  })

  if (response.status === 401 && !isRetry && !skipAuth) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      return apiFetch<T>(path, { ...options, isRetry: true })
    }
    clearAuthCookies()
    // Only redirect if not already on login/register pages
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    throw new ApiClientError('TOKEN_EXPIRED', 'Sesi habis, silakan login ulang', 401)
  }

  const json = await response.json()

  if (!response.ok || !json.success) {
    throw new ApiClientError(
      json.error?.code ?? 'INTERNAL_ERROR',
      json.error?.message ?? 'Terjadi kesalahan server',
      response.status
    )
  }

  return json as T
}

// ── Error class ───────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly status: number
  ) {
    super(userMessage)
    this.name = 'ApiClientError'
  }
}

// ── Convenience methods ───────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { method: 'GET', ...opts }),

  post: <T>(path: string, body: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...opts,
    }),

  patch: <T>(path: string, body: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...opts,
    }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { method: 'DELETE', ...opts }),

  // Auth helpers (for backward compatibility)
  setTokens: setAuthCookies,
  clearTokens: clearAuthCookies,
}
