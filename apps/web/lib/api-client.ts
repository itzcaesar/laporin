// ── lib/api-client.ts ──
// Core API client with automatic token refresh and error handling
// Tokens are stored in HttpOnly cookies (set by the API server).
// The client cannot read them — they are sent automatically via credentials: 'include'.

// ── lib/api-client.ts ──
// Core API client with automatic token refresh and error handling
// Tokens are stored in HttpOnly cookies (set by the API server).
// The client cannot read them — they are sent automatically via credentials: 'include'.

/**
 * Get API base URL
 * Priority: NEXT_PUBLIC_API_URL > dynamic construction (dev) > localhost fallback
 */
const getBaseUrl = () => {
  // Always use environment variable if explicitly set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Client-side: construct from window location (for local network testing)
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`
  }
  
  // Server-side fallback
  return 'http://localhost:4000'
}

const BASE_URL = getBaseUrl()

// ── Cookie helpers (only for non-HttpOnly cookies) ──────────────────────

/**
 * Read CSRF token from non-HttpOnly cookie.
 * This cookie is set by the API server and readable by JS for CSRF protection.
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  return (
    document.cookie
      .split('; ')
      .find(row => row.startsWith('laporin_csrf='))
      ?.split('=')[1] ?? null
  )
}

/**
 * Read role from non-HttpOnly cookie (used for client-side routing decisions).
 */
export function getRole(): string | null {
  if (typeof document === 'undefined') return null
  return (
    document.cookie
      .split('; ')
      .find(row => row.startsWith('laporin_role='))
      ?.split('=')[1] ?? null
  )
}

/**
 * Check if the user appears to have an active session.
 * Since the access token is HttpOnly, we check for the role cookie as a proxy.
 * The role cookie has the same lifetime as the refresh token (7 days).
 */
export function hasSession(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.includes('laporin_role=')
}

/**
 * Clear non-HttpOnly cookies on the client side.
 * HttpOnly cookies (laporin_token, laporin_refresh) are cleared by the server on logout.
 * This clears the role and CSRF cookies which are client-readable.
 */
export function clearClientCookies(): void {
  if (typeof document === 'undefined') return
  document.cookie = 'laporin_role=; path=/; max-age=0'
  document.cookie = 'laporin_csrf=; path=/; max-age=0'
}

// ── Refresh ───────────────────────────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null

async function doRefreshToken(): Promise<boolean> {
  try {
    // The refresh token is in an HttpOnly cookie — sent automatically
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      // Refresh token is read from the HttpOnly cookie by the server.
      // We still send an empty body (or minimal body) to satisfy the validator.
      body: JSON.stringify({ refreshToken: '_cookie_' }),
    })
    if (!res.ok) return false
    const json = await res.json()
    if (json.success) {
      // The server sets the new access token as an HttpOnly cookie in the response.
      // No need to do anything client-side.
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

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers as Record<string, string>,
  }

  // Add CSRF token for state-changing requests
  const method = (fetchOptions.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = getCsrfToken()
    if (csrf) {
      headers['X-CSRF-Token'] = csrf
    }
  }

  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Send HttpOnly cookies automatically
  })

  if (response.status === 401 && !isRetry && !skipAuth) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      return apiFetch<T>(path, { ...options, isRetry: true })
    }
    clearClientCookies()
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

  // Legacy compat stubs (cookies are now server-managed)
  setTokens: () => {},
  clearTokens: clearClientCookies,
}
