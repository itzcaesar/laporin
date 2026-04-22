// ── components/dashboard/gov/BulkActionBar.tsx ──
"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type BulkActionBarProps = {
  selectedCount: number;
  onAssignBulk: () => void;
  onUpdateStatusBulk: () => void;
  onClearSelection: () => void;
  className?: string;
};

export function BulkActionBar({
  selectedCount,
  onAssignBulk,
  onUpdateStatusBulk,
  onClearSelection,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl bg-navy p-4 shadow-lg",
        "md:relative md:mb-4",
        "fixed bottom-20 left-4 right-4 z-30 md:bottom-auto md:left-auto md:right-auto",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white">
          {selectedCount} dipilih
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAssignBulk}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Assign Massal
        </button>
        <button
          type="button"
          onClick={onUpdateStatusBulk}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Update Status Massal
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
          aria-label="Batalkan pilihan"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
