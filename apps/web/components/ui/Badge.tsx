// ── components/ui/Badge.tsx ──
import { cn } from "@/lib/utils";
import type { BadgeProps } from "@/types";

const VARIANT_STYLES: Record<string, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-light text-blue",
};

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1",
        "font-display text-xs font-semibold",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
