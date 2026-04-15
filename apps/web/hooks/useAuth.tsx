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

  useEffect(() => {
    api
      .get<{ data: User }>("/user/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      data: { accessToken: string; role: string; user: User };
    }>("/auth/login", { email, password }, { skipAuth: true });
    api.setTokens(res.data.accessToken, res.data.role);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout", {}).catch(() => {});
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
