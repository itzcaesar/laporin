// ── components/dashboard/gov/DaruratAlertBanner.tsx ──
"use client";

import Link from "next/link";

type UrgentReport = {
  id: string;
  title: string;
  locationAddress: string;
};

type DaruratAlertBannerProps = {
  urgentReports: UrgentReport[];
};

export function DaruratAlertBanner({
  urgentReports,
}: DaruratAlertBannerProps) {
  if (urgentReports.length === 0) return null;

  const displayReports = urgentReports.slice(0, 2);
  const remainingCount = urgentReports.length - displayReports.length;

  return (
    <div className="rounded-xl bg-red-50 border-l-4 border-red-500 p-4">
      <div className="flex items-start gap-3">
        {/* Pulsing red dot */}
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold font-display text-red-900 mb-2">
            {urgentReports.length} laporan DARURAT membutuhkan respons segera
          </h3>

          <div className="space-y-1.5">
            {displayReports.map((report) => (
              <Link
                key={report.id}
                href={`/gov/reports/${report.id}`}
                className="block text-sm text-red-800 hover:text-red-900 hover:underline transition-colors"
              >
                · {report.title} — {report.locationAddress}
              </Link>
            ))}
          </div>

          {remainingCount > 0 && (
            <Link
              href="/gov/reports?priority=urgent"
              className="mt-2 inline-block text-sm font-medium text-red-700 hover:text-red-900 hover:underline transition-colors"
            >
              + {remainingCount} laporan lainnya →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
