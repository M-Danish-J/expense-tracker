import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "danger" | "info";

const toneStyles: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-900",
  success: "bg-success-light text-success",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
};

interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon: LucideIcon;
  readonly tone?: Tone;
  readonly caption?: string;
  readonly className?: string;
}

/**
 * Pencil spec — Card/Stat: radius-lg, padding 24, gap 12,
 * label 13px/500 secondary, value 28px/700, footer 12px.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  caption,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-lg shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-label font-medium text-content-secondary">{label}</p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            toneStyles[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-3 text-stat font-bold text-content">{value}</p>
      {caption ? (
        <p className="mt-1.5 text-caption text-content-secondary">{caption}</p>
      ) : null}
    </div>
  );
}
