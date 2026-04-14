// ── components/ui/StepCard.tsx ──
import { cn } from "@/lib/utils";
import type { StepCardProps } from "@/types";

export function StepCard({ step, isLast = false, className }: StepCardProps) {
  return (
    <div className={cn("relative flex flex-row gap-4 text-left md:flex-col md:items-center md:text-center md:gap-0", className)}>
      {/* Connector line (desktop only, hidden on last) */}
      {!isLast && (
        <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-blue/30 to-blue/10 md:block" />
      )}

      {/* Number circle */}
      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue text-white shadow-lg sm:h-16 sm:w-16 md:mb-4">
        <span className="text-lg drop-shadow-md sm:text-2xl">{step.icon}</span>
      </div>

      {/* Text block wrapper */}
      <div className="flex flex-col">
        {/* Step number */}
        <span className="mb-1 font-display text-[10px] font-semibold uppercase tracking-wider text-blue sm:mb-2 sm:text-xs">
          Langkah {step.number}
        </span>

        {/* Title */}
        <h3 className="mb-1 font-display text-sm font-bold text-navy sm:mb-2 sm:text-lg">
          {step.title}
        </h3>

        {/* Description */}
        <p className="max-w-[240px] text-xs leading-relaxed text-muted sm:text-sm md:mx-auto">
          {step.description}
        </p>
      </div>
    </div>
  );
}
