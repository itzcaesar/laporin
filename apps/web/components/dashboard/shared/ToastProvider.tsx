// ── components/dashboard/shared/ToastProvider.tsx ──
// Lightweight toast notification system — no external libraries

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ToastContext, type Toast, type ToastType } from "@/hooks/useToast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const TOAST_DURATION = 3000;

const TOAST_STYLES: Record<ToastType, string> = {
  success: "bg-navy text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue text-white",
};

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, TOAST_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3",
        "px-4 py-3",
        "min-w-[280px] max-w-[420px]",
        "text-sm font-medium font-body",
        "rounded-xl shadow-lg",
        "transition-all duration-300 ease-out",
        isExiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100 animate-slide-in-right",
        TOAST_STYLES[toast.type]
      )}
    >
      <span className="flex-shrink-0">{TOAST_ICONS[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity duration-150"
        aria-label="Tutup"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast container: top-right desktop, top-center mobile */}
      <div
        className={cn(
          "fixed z-[9999]",
          "top-4 left-1/2 -translate-x-1/2",
          "md:top-6 md:right-6 md:left-auto md:translate-x-0",
          "flex flex-col gap-2",
          "pointer-events-none"
        )}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
