// ── components/ui/TestimonialCard.tsx ──
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import type { TestimonialCardProps } from "@/types";

export const TestimonialCard = memo(function TestimonialCard({
  testimonial,
  className,
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-[300px] flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm",
        "snap-center",
        "md:min-w-0",
        className
      )}
    >
      {/* Stars */}
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={cn(
              i < testimonial.rating
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="mb-6 flex-1 text-sm leading-relaxed text-ink">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white",
            testimonial.isGovernment ? "bg-teal" : "bg-navy"
          )}
        >
          {testimonial.initials}
        </div>
        <div>
          <div className="font-display text-sm font-semibold text-navy">
            {testimonial.name}
          </div>
          <div className="text-xs text-muted">
            {testimonial.role} · {testimonial.location}
          </div>
        </div>
      </div>
    </div>
  );
});
