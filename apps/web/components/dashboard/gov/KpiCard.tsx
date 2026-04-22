// ── components/dashboard/gov/KpiCard.tsx ──
"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Trend = {
  value: number;
  direction: "up" | "down" | "neutral";
  isPositive: boolean;
};

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: Trend;
  icon: LucideIcon;
  iconColor: "blue" | "red" | "green" | "amber";
  href?: string;
  isLoading?: boolean;
};

const ICON_COLORS = {
  blue: "bg-blue-light text-blue",
  red: "bg-red-50 text-red-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor,
  href,
  isLoading = false,
}: KpiCardProps) {
  const content = (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-sm border border-border transition-all duration-200",
        href && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      )}
    >
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="h-8 w-24 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
      ) : (
        <>
          {/* Icon */}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full mb-4",
              ICON_COLORS[iconColor]
            )}
          >
            <Icon size={20} />
          </div>

          {/* Value */}
          <div className="text-3xl font-bold font-display text-ink mb-1">
            {value}
          </div>

          {/* Title */}
          <div className="text-sm text-muted font-body">{title}</div>

          {/* Subtitle or Trend */}
          {subtitle && (
            <div className="mt-2 text-xs text-muted">{subtitle}</div>
          )}

          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium">
              {trend.direction === "up" && (
                <span
                  className={cn(
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  ↑ {trend.value > 0 ? "+" : ""}
                  {trend.value}
                </span>
              )}
              {trend.direction === "down" && (
                <span
                  className={cn(
                    trend.isPositive ? "text-red-600" : "text-green-600"
                  )}
                >
                  ↓ {trend.value}
                </span>
              )}
              {trend.direction === "neutral" && (
                <span className="text-muted">→ stabil</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
