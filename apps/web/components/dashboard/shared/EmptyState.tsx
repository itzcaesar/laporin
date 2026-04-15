// ── components/dashboard/shared/EmptyState.tsx ──
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {/* Icon or Emoji */}
      {Icon && (
        <div className="mb-4 rounded-full bg-surface p-4">
          <Icon size={32} className="text-muted" />
        </div>
      )}
      {emoji && <div className="mb-4 text-5xl">{emoji}</div>}

      {/* Title */}
      <h3 className="text-lg font-semibold font-display text-ink mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm font-body text-muted max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
