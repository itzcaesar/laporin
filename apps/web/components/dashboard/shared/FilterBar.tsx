// ── components/dashboard/shared/FilterBar.tsx ──
"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterConfig = {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

type FilterBarProps = {
  filters: FilterConfig[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
};

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClear,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Cari laporan...",
}: FilterBarProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Count active filters (excluding empty values)
  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v && v !== "all"
  ).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-border">
        {/* Filter Dropdowns */}
        {filters.map((filter) => (
          <div key={filter.key} className="flex-shrink-0">
            <label className="block text-xs font-medium text-muted mb-1">
              {filter.label}
            </label>
            <select
              value={activeFilters[filter.key] || "all"}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all min-w-[140px]"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Search Input */}
        {onSearchChange && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted mb-1">
              Pencarian
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={16}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-sm font-medium text-blue hover:text-blue/80 transition-colors self-end pb-2"
          >
            <X size={14} />
            Reset Filter
          </button>
        )}
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="btn-interactive flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-border"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-muted" />
            <span className="text-sm font-medium text-ink">Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>
          <span className="text-sm text-muted">→</span>
        </button>

        {/* Search on Mobile */}
        {onSearchChange && (
          <div className="mt-3 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              size={16}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all"
            />
          </div>
        )}
      </div>

      {/* Mobile Filter Panel */}
      {isMobileFilterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white shadow-2xl md:hidden max-h-[90vh] overflow-y-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-2 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-6 pb-4 border-b border-border">
              <h3 className="text-base font-bold font-display text-navy">
                Filter Laporan
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pt-4 space-y-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-ink mb-2">
                    {filter.label}
                  </label>
                  <select
                    value={activeFilters[filter.key] || "all"}
                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all"
                  >
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="px-6 pt-5 flex gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink hover:bg-surface transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 btn-interactive rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white hover:bg-navy/90 transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
