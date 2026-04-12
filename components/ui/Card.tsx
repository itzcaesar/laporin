// ── components/ui/Card.tsx ──
import { cn } from "@/lib/utils";
import type { CardProps } from "@/types";

const PADDING_STYLES: Record<string, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white shadow-sm",
        PADDING_STYLES[padding],
        hover &&
          "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}
