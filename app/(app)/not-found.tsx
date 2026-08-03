import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Reached when a record doesn't exist *or* belongs to another workspace — RLS
 * makes those indistinguishable, which is the point: we don't confirm that
 * someone else's data exists.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-pill bg-surface-secondary">
        <SearchX className="size-5 text-content-muted" aria-hidden />
      </span>
      <h1 className="mt-md text-h1 font-semibold tracking-tight text-content">
        Not found
      </h1>
      <p className="mt-2 max-w-[46ch] text-body text-content-secondary">
        This record doesn&apos;t exist, or it isn&apos;t part of the workspace
        you&apos;re currently in.
      </p>
      <div className="mt-xl flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/transactions">View transactions</Link>
        </Button>
      </div>
    </div>
  );
}
