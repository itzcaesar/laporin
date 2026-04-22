// ── lib/api-client.ts ──
// API client with cookie-based token management, auto-refresh, and enhanced features

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Track if a refresh is in progress to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<boolean> | null = null;

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

// Response cache
const cache = new Map<string, { data: any; timestamp: number; etag?: string }>();

// Request ID generator
let requestIdCounter = 0;
function generateRequestId(): string {
  return `req_${Date.now()}_${++requestIdCounter}`;
}

// Performance tracking
interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

const metrics: RequestMetrics[] = [];

function trackMetrics(metric: RequestMetrics) {
  metrics.push(metric);
  
  // Keep only last 100 metrics
  if (metrics.length > 100) {
    metrics.shift();
  }
  
  // Log slow requests in development
  if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
    console.warn(`[API] Slow request: ${metric.method} ${metric.url} took ${metric.duration}ms`);
  }
}

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

function getRefreshToken(): string | null {
  if (typeof document === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("laporin_refresh="))
      ?.split("=")[1] ?? null
  );
}

function setTokens(accessToken: string, role: string, refreshToken?: string): void {
  // Access token expires in 15 minutes
  document.cookie = `laporin_token=${accessToken}; path=/; max-age=${15 * 60}; SameSite=Strict`;
  document.cookie = `laporin_role=${role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  
  // Store refresh token if provided (expires in 7 days)
  // Note: Not using HttpOnly since we need to access it from JavaScript
  if (refreshToken) {
    document.cookie = `laporin_refresh=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  }
}

function clearTokens(): void {
  document.cookie = "laporin_token=; path=/; max-age=0";
  document.cookie = "laporin_role=; path=/; max-age=0";
  document.cookie = "laporin_refresh=; path=/; max-age=0";
  refreshPromise = null;
}

// ── Base fetcher ─────────────────────────────────────────────────────────

type FetchOptions = RequestInit & { 
  skipAuth?: boolean
  skipCache?: boolean
  cacheTTL?: number
};

async function request<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, skipCache = false, cacheTTL, ...fetchOptions } = options;
  const token = skipAuth ? null : getToken();
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Check cache for GET requests
  if (fetchOptions.method === 'GET' && !skipCache) {
    const cacheKey = `${fetchOptions.method}:${path}`;
    const cached = cache.get(cacheKey);
    
    if (cached && cacheTTL) {
      const age = Date.now() - cached.timestamp;
      if (age < cacheTTL) {
        console.log(`[API] Cache hit: ${path} (age: ${age}ms)`);
        return cached.data;
      }
    }
  }

  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Request-ID': requestId,
      // Disable browser caching for API requests
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...fetchOptions.headers,
    },
  });

  const duration = Date.now() - startTime;

  // Track metrics
  trackMetrics({
    url: path,
    method: fetchOptions.method || 'GET',
    duration,
    status: response.status,
    timestamp: Date.now(),
  });

  if (response.status === 401) {
    // If skipAuth is true, this is a login attempt - don't try to refresh
    if (skipAuth) {
      const error = await response
        .json()
        .catch(() => ({ error: "Invalid credentials" }));
      throw new Error(error.error ?? "Invalid credentials");
    }
    
    // Try refresh for authenticated requests
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

  const data = await response.json();

  // Cache successful GET responses
  if (fetchOptions.method === 'GET' && !skipCache && cacheTTL) {
    const cacheKey = `${fetchOptions.method}:${path}`;
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      etag: response.headers.get('etag') || undefined,
    });
  }

  return data;
}

async function tryRefreshToken(): Promise<boolean> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Start a new refresh attempt
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        console.warn("No refresh token available");
        return false;
      }

      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        console.warn("Token refresh failed:", res.status);
        return false;
      }

      const { data } = await res.json();
      
      // Get current role from cookie
      const currentRole = document.cookie
        .split("; ")
        .find((row) => row.startsWith("laporin_role="))
        ?.split("=")[1] ?? "citizen";
      
      // Update access token (keep existing refresh token)
      setTokens(data.accessToken, currentRole);
      
      console.log("Token refreshed successfully");
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    } finally {
      // Clear the promise after completion
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Exported API client ───────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: FetchOptions) =>
    request<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      skipCache: true, // Always skip cache for POST requests
      ...opts,
    }),

  patch: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      skipCache: true, // Always skip cache for PATCH requests
      ...opts,
    }),

  delete: <T>(path: string, opts?: FetchOptions) =>
    request<T>(path, { 
      method: "DELETE",
      skipCache: true, // Always skip cache for DELETE requests
      ...opts 
    }),

  // GET with caching
  getCached: <T>(path: string, ttl: number = 60000, opts?: FetchOptions) =>
    request<T>(path, { method: "GET", cacheTTL: ttl, ...opts }),

  // Clear cache
  clearCache: (pattern?: string) => {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  },

  // Get metrics
  getMetrics: () => ({
    requests: metrics.length,
    avgDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length || 0,
    slowRequests: metrics.filter(m => m.duration > 1000).length,
    errors: metrics.filter(m => m.status >= 400).length,
  }),

  setTokens,
  clearTokens,
};
