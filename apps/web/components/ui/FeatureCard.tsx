// ── components/ui/FeatureCard.tsx ──
import { cn } from "@/lib/utils";
import type { FeatureCardProps } from "@/types";

export function FeatureCard({ feature, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-row items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-col sm:items-start sm:gap-0 sm:p-6",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl sm:mb-4 sm:h-14 sm:w-14",
          "transition-colors duration-200",
          "bg-blue-light group-hover:bg-blue group-hover:text-white",
          feature.accent
        )}
      >
        {feature.icon}
      </div>

      <div className="flex flex-col">
        {/* Title */}
        <h3 className="mb-1 font-display text-base font-semibold text-navy sm:mb-2 sm:text-xl">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-muted">
          {feature.description}
        </p>
      </div>
    </div>
  );
}
