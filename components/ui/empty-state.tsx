import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

/**
 * The single empty state used across every data-driven page, so "nothing here
 * yet" always looks and reads the same.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-lg py-2xl text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-lg bg-surface-secondary">
        <Icon className="size-5 text-content-muted" aria-hidden />
      </div>
      <h3 className="mt-md text-h3 font-medium text-content">{title}</h3>
      <p className="mt-1.5 max-w-[38ch] text-body text-content-secondary">
        {description}
      </p>
      {action ? <div className="mt-lg">{action}</div> : null}
    </div>
  );
}
