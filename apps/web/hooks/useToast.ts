// ── hooks/useToast.ts ──
// Toast notification context hook

"use client";

import { createContext, useContext, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Returns toast notification functions. Must be inside ToastProvider.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");

  const success = useCallback(
    (message: string) => ctx.addToast(message, "success"),
    [ctx]
  );
  const error = useCallback(
    (message: string) => ctx.addToast(message, "error"),
    [ctx]
  );
  const info = useCallback(
    (message: string) => ctx.addToast(message, "info"),
    [ctx]
  );

  return { success, error, info };
}
