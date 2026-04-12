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
        "mb-12 max-w-3xl md:mb-16",
        isCenter && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-blue-light px-4 py-1.5 font-display text-sm font-semibold text-blue">
          {eyebrow}
        </span>
      )}
      <h2 className="section-heading">{heading}</h2>
      {subheading && <p className="section-sub">{subheading}</p>}
    </div>
  );
}
