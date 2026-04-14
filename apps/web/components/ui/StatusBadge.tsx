// ── components/ui/StatusBadge.tsx ──
import { cn } from "@/lib/utils";
import type { StatusBadgeProps } from "@/types";

export function StatusBadge({ stage, className }: StatusBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold",
        className
      )}
      style={{
        backgroundColor: stage.color,
        color: stage.textColor,
      }}
    >
      <span>{stage.emoji}</span>
      <span>{stage.label}</span>
    </div>
  );
}
