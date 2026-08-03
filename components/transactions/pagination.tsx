import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Server-rendered pagination: each control is a real link carrying the current
 * filters, so pages are bookmarkable and work without JavaScript.
 */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  buildHref,
}: {
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
  readonly pageSize: number;
  readonly buildHref: (page: number) => string;
}) {
  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-caption text-content-secondary">
        Showing <span className="font-medium text-content">{first}</span>–
        <span className="font-medium text-content">{last}</span> of{" "}
        <span className="font-medium text-content">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <PageLink
          href={buildHref(page - 1)}
          disabled={page <= 1}
          label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </PageLink>

        <span className="px-3 text-caption text-content-secondary">
          Page {page} of {pageCount}
        </span>

        <PageLink
          href={buildHref(page + 1)}
          disabled={page >= pageCount}
          label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  readonly href: string;
  readonly disabled: boolean;
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  const classes = cn(
    "inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-body font-medium transition-colors",
    disabled
      ? "cursor-not-allowed border-border-light text-content-muted"
      : "bg-surface text-content hover:bg-surface-secondary",
  );

  if (disabled) {
    return (
      <span className={classes} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={label} scroll={false}>
      {children}
    </Link>
  );
}
