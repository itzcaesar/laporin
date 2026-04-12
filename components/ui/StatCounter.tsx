// ── components/ui/StatCounter.tsx ──
"use client";

import { cn } from "@/lib/utils";
import { useCounterAnimation } from "@/hooks/useCounterAnimation";
import type { StatCounterProps } from "@/types";

export function StatCounter({ stat, className }: StatCounterProps) {
  const { value, ref } = useCounterAnimation(
    stat.value,
    1500,
    stat.decimals ?? 0
  );

  return (
    <div ref={ref} className={cn("text-center", className)}>
      <div className="font-display text-4xl font-extrabold text-white md:text-5xl">
        {stat.prefix}
        {value.toLocaleString("id-ID")}
        {stat.suffix}
      </div>
      <div className="mt-2 text-sm font-medium text-white/80 md:text-base">
        {stat.label}
      </div>
    </div>
  );
}
