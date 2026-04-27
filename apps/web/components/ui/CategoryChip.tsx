// ── components/ui/CategoryChip.tsx ──
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { CategoryChipProps } from '@/types/ui';

export const CategoryChip = memo(function CategoryChip({ category, className }: CategoryChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl border-2 border-navy/20 px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-3",
        "font-display text-[10px] font-medium text-navy sm:text-sm",
        "transition-all duration-200",
        "hover:border-navy hover:bg-navy hover:text-white",
        "cursor-default min-h-[44px]",
        className
      )}
    >
      <span className="text-sm sm:text-lg">{category.emoji}</span>
      <span className="leading-tight">{category.name}</span>
    </div>
  );
});
