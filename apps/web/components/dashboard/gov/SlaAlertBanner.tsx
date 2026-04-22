// ── components/dashboard/gov/SlaAlertBanner.tsx ──
"use client";

import Link from "next/link";

type SlaAlertBannerProps = {
  breachedCount: number;
};

export function SlaAlertBanner({ breachedCount }: SlaAlertBannerProps) {
  if (breachedCount === 0) return null;

  return (
    <div className="rounded-xl bg-amber-50 border-l-4 border-amber-500 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠</span>
          <p className="text-sm font-medium text-amber-900">
            {breachedCount} laporan melampaui target SLA
          </p>
        </div>
        <Link
          href="/gov/reports?filter=sla_breached"
          className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          Tangani Sekarang →
        </Link>
      </div>
    </div>
  );
}
