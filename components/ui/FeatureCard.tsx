// ── components/ui/FeatureCard.tsx ──
import { cn } from "@/lib/utils";
import type { FeatureCardProps } from "@/types";

export function FeatureCard({ feature, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl",
          "transition-colors duration-200",
          "bg-blue-light group-hover:bg-blue group-hover:text-white",
          feature.accent
        )}
      >
        {feature.icon}
      </div>

      {/* Title */}
      <h3 className="mb-2 font-display text-xl font-semibold text-navy">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-muted">
        {feature.description}
      </p>
    </div>
  );
}
