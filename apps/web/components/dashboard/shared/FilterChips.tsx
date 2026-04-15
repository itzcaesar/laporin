// ── components/dashboard/shared/FilterChips.tsx ──
"use client";

import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterChips({
  options,
  active,
  onChange,
  className,
}: FilterChipsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-2 scrollbar-hide",
        className
      )}
    >
      {options.map((option) => {
        const isActive = active === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-[44px] shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
              isActive
                ? "bg-navy text-white shadow-sm"
                : "border border-border bg-white text-ink hover:border-navy/20 hover:bg-surface"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
