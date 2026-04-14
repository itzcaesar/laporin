// ── components/ui/Button.tsx ──
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonProps, ButtonVariant, ButtonSize } from "@/types";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-blue text-white hover:bg-blue/90 shadow-sm hover:shadow-md",
  secondary:
    "bg-navy text-white hover:bg-navy/90 shadow-sm hover:shadow-md",
  outline:
    "border-2 border-navy text-navy bg-transparent hover:bg-navy hover:text-white",
  ghost:
    "text-navy bg-transparent hover:bg-navy/5",
  "outline-white":
    "border-2 border-white text-white bg-transparent hover:bg-white hover:text-navy",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm min-h-[36px]",
  md: "px-6 py-3 text-base min-h-[44px]",
  lg: "px-8 py-4 text-lg min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  onClick,
  disabled = false,
  className,
  children,
  ariaLabel,
}: ButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center justify-center gap-2 font-display font-semibold",
    "rounded-xl transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseStyles} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={baseStyles}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
