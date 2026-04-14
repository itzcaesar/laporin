// ── components/ui/SectionHeader.tsx ──
import { cn } from "@/lib/utils";
import type { SectionHeaderProps } from "@/types";

export function SectionHeader({
  eyebrow,
  heading,
  subheading,
  alignment = "center",
  className,
}: SectionHeaderProps) {
  const isCenter = alignment === "center";

  return (
    <div
      className={cn(
        "mb-8 max-w-3xl sm:mb-12 md:mb-16",
        isCenter && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="mb-2 inline-block rounded-full bg-blue-light px-3 py-1 font-display text-xs font-semibold text-blue sm:mb-3 sm:px-4 sm:py-1.5 sm:text-sm">
          {eyebrow}
        </span>
      )}
      <h2 className="section-heading">{heading}</h2>
      {subheading && <p className={cn("section-sub", isCenter && "mx-auto")}>{subheading}</p>}
    </div>
  );
}
