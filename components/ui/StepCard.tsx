// ── components/ui/StepCard.tsx ──
import { cn } from "@/lib/utils";
import type { StepCardProps } from "@/types";

export function StepCard({ step, isLast = false, className }: StepCardProps) {
  return (
    <div className={cn("relative flex flex-col items-center text-center", className)}>
      {/* Connector line (desktop only, hidden on last) */}
      {!isLast && (
        <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-blue/30 to-blue/10 md:block" />
      )}

      {/* Number circle */}
      <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-navy to-blue text-white shadow-lg">
        <span className="text-2xl">{step.icon}</span>
      </div>

      {/* Step number */}
      <span className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-blue">
        Langkah {step.number}
      </span>

      {/* Title */}
      <h3 className="mb-2 font-display text-lg font-bold text-navy">
        {step.title}
      </h3>

      {/* Description */}
      <p className="max-w-[240px] text-sm leading-relaxed text-muted">
        {step.description}
      </p>
    </div>
  );
}
