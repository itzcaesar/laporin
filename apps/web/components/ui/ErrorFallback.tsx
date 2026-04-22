// ── components/ui/ErrorFallback.tsx ──
// Error fallback UI component

"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  resetError,
  title = "Terjadi Kesalahan",
  message,
}: ErrorFallbackProps) {
  const router = useRouter();

  const handleReset = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display text-ink">
            {title}
          </h2>
          <p className="text-muted">
            {message ||
              "Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi."}
          </p>
        </div>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === "development" && error && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted hover:text-ink">
              Detail teknis
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-40 text-left">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue text-white rounded-xl font-semibold hover:bg-blue/90 transition-colors min-h-[44px]"
          >
            <RefreshCw size={18} />
            Coba Lagi
          </button>
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-ink border border-border rounded-xl font-semibold hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <Home size={18} />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message component
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-900">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Coba lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({
  icon: Icon = AlertTriangle,
  title = "Tidak Ada Data",
  message = "Belum ada data untuk ditampilkan.",
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Icon className="h-10 w-10 text-gray-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold font-display text-ink">
            {title}
          </h3>
          <p className="text-sm text-muted">{message}</p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue text-white rounded-xl font-semibold hover:bg-blue/90 transition-colors min-h-[44px]"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
