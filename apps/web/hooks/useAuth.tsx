// ── hooks/useAuth.ts ──
// AuthProvider context + useAuth hook for dashboard authentication

"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const pathname = usePathname();

  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");

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
      .catch(() => {
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
    api.setTokens(res.data.accessToken, res.data.user.role);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    // Clear tokens locally (we don't have refresh token to send to API)
    api.clearTokens();
    setUser(null);
    window.location.href = "/login";
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
