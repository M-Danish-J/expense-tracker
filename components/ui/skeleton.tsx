import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-tertiary/70", className)}
      {...props}
    />
  );
}

/** Placeholder shaped like a stat card, used as a Suspense fallback. */
function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-lg shadow-card">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-8 w-36" />
      <Skeleton className="mt-3 h-3.5 w-28" />
    </div>
  );
}

/** Placeholder shaped like a table, used as a Suspense fallback. */
function TableSkeleton({ rows = 6 }: { readonly rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="h-11 border-b border-border-light bg-surface-secondary" />
      <div className="divide-y divide-border-light">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-24 shrink-0 rounded-pill" />
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-lg shadow-card",
        className,
      )}
    >
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-lg h-[240px] w-full rounded-md" />
    </div>
  );
}

export { Skeleton, StatCardSkeleton, TableSkeleton, ChartSkeleton };
