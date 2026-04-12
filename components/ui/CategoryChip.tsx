// ── components/ui/CategoryChip.tsx ──
import { cn } from "@/lib/utils";
import type { CategoryChipProps } from "@/types";

export function CategoryChip({ category, className }: CategoryChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border-2 border-navy/20 px-4 py-3",
        "font-display text-sm font-medium text-navy",
        "transition-all duration-200",
        "hover:border-navy hover:bg-navy hover:text-white",
        "cursor-default min-h-[44px]",
        className
      )}
    >
      <span className="text-lg">{category.emoji}</span>
      <span className="leading-tight">{category.name}</span>
    </div>
  );
}
