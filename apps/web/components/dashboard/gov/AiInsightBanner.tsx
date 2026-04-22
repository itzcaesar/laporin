// ── components/dashboard/gov/AiInsightBanner.tsx ──
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type AiInsightBannerProps = {
  insight: string | null;
  isLoading?: boolean;
};

export function AiInsightBanner({
  insight,
  isLoading = false,
}: AiInsightBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if dismissed in sessionStorage
  useEffect(() => {
    const dismissed = sessionStorage.getItem("ai_insight_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("ai_insight_dismissed", "true");
  };

  if (isDismissed || (!insight && !isLoading)) return null;

  return (
    <div className="rounded-xl bg-teal-light border-l-4 border-teal p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">🤖</span>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-teal/20" />
              <div className="h-4 w-full rounded bg-teal/20" />
            </div>
          ) : (
            <p className="text-sm text-teal-900 leading-relaxed">{insight}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-teal-700 hover:bg-teal/10 transition-colors"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
