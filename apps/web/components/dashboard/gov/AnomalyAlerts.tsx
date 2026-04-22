// ── components/dashboard/gov/AnomalyAlerts.tsx ──
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

type Anomaly = {
  id: string;
  regionName: string;
  categoryName: string;
  spikePercent: number;
  hoursAgo: number;
  reportCount: number;
};

type AnomalyAlertsProps = {
  anomalies: Anomaly[];
};

export function AnomalyAlerts({ anomalies }: AnomalyAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Load dismissed IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dismissed_anomalies");
    if (stored) {
      try {
        const parsed: Array<{ id: string; timestamp: number }> = JSON.parse(stored);
        // Filter out anomalies older than 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const valid = parsed.filter((item) => item.timestamp > sevenDaysAgo);
        setDismissedIds(valid.map((item) => item.id));
      } catch (e) {
        console.error("Failed to parse dismissed anomalies:", e);
      }
    }
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);

    // Store with timestamp
    const toStore = newDismissed.map((id) => ({
      id,
      timestamp: Date.now(),
    }));
    localStorage.setItem("dismissed_anomalies", JSON.stringify(toStore));
  };

  const visibleAnomalies = anomalies.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (visibleAnomalies.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold font-display text-navy">
        🚨 Deteksi Anomali AI
      </h3>
      {visibleAnomalies.map((anomaly) => (
        <div
          key={anomaly.id}
          className="rounded-xl bg-red-50 border-l-4 border-red-500 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-red-900 mb-1">
                ● Lonjakan laporan {anomaly.categoryName} di {anomaly.regionName}
              </h4>
              <p className="text-sm text-red-800 mb-2">
                +{anomaly.spikePercent}% dari rata-rata dalam {anomaly.hoursAgo}{" "}
                jam terakhir
              </p>
              <Link
                href={`/gov/reports?region=${anomaly.regionName}&category=${anomaly.categoryName}`}
                className="text-sm font-medium text-red-700 hover:text-red-900 transition-colors"
              >
                Lihat {anomaly.reportCount} Laporan →
              </Link>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(anomaly.id)}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-red-700 hover:bg-red-100 transition-colors"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
