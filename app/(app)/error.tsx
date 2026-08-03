"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Segment boundary for the authenticated app.
 *
 * Whatever actually failed — a database error, a dropped connection — the user
 * gets the same plain explanation. The underlying error goes to the server log,
 * never to the screen.
 */
export default function AppError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("[expensio] route error", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-pill bg-danger-light">
        <AlertTriangle className="size-5 text-danger" aria-hidden />
      </span>
      <h1 className="mt-md text-h1 font-semibold tracking-tight text-content">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-[46ch] text-body text-content-secondary">
        We couldn&apos;t load this page. Your data is safe — this was a problem
        displaying it, not storing it.
      </p>
      {error.digest ? (
        <p className="mt-3 text-caption text-content-muted">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-xl flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCw aria-hidden />
          Try again
        </Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
