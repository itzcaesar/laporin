// ── hooks/useAuth.ts ──
// AuthProvider context + useAuth hook for dashboard authentication

"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Token refresh interval: 13 minutes (tokens expire in 15 minutes)
const REFRESH_INTERVAL = 13 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const pathname = usePathname();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  // Setup automatic token refresh
  useEffect(() => {
    if (!user || isAuthPage) {
      // Clear refresh timer if user is logged out or on auth page
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    // Refresh token proactively every 13 minutes
    const refreshToken = async () => {
      try {
        const refreshTokenValue = document.cookie
          .split("; ")
          .find((row) => row.startsWith("laporin_refresh="))
          ?.split("=")[1];

        if (!refreshTokenValue) {
          console.warn("No refresh token found, logging out");
          await logout();
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: refreshTokenValue }),
          }
        );

        if (!res.ok) {
          console.warn("Token refresh failed, logging out");
          await logout();
          return;
        }

        const { data } = await res.json();
        api.setTokens(data.accessToken, user.role);
        console.log("Token refreshed proactively");
      } catch (error) {
        console.error("Proactive token refresh error:", error);
        await logout();
      }
    };

    // Set up interval for proactive refresh
    refreshTimerRef.current = setInterval(refreshToken, REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [user, isAuthPage]);

  useEffect(() => {
    // Skip auth check on auth pages
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    // Only fetch user if we have a token
    const hasToken = document.cookie.includes("laporin_token=");
    if (!hasToken) {
      setLoading(false);
      return;
    }

    api
      .get<{ data: User }>("/auth/me")
      .then((res) => setUser(res.data))
      .catch((error) => {
        console.error("Failed to fetch user:", error);
        setUser(null);
        // Clear invalid tokens
        api.clearTokens();
      })
      .finally(() => setLoading(false));
  }, [isAuthPage]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      data: { accessToken: string; refreshToken: string; user: User };
    }>("/auth/login", { email, password }, { skipAuth: true });
    
    // Store both access and refresh tokens
    api.setTokens(res.data.accessToken, res.data.user.role, res.data.refreshToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Get refresh token from cookie
      const refreshToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("laporin_refresh="))
        ?.split("=")[1];

      // Call logout endpoint to revoke refresh token
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }).catch(() => {
          // Ignore errors - logout locally anyway
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear tokens and redirect
      api.clearTokens();
      setUser(null);
      
      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Returns the current auth state. Must be inside AuthProvider.
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
