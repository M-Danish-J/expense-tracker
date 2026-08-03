"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Account, Category } from "@/lib/db/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ANY = "__any__";

/** Params that actually narrow results — paging and sorting don't count. */
const FILTER_KEYS = ["type", "account", "category", "from", "to"] as const;

/**
 * Filters live entirely in the URL, so the server component that renders the
 * table is the single source of truth, the state survives a refresh, and any
 * view is shareable. Nothing is filtered in the browser.
 *
 * On phones the controls would otherwise push the table below the fold, so
 * everything except search collapses into a bottom sheet behind a "Filters"
 * button that shows how many are active.
 */
export function TransactionFilters({
  accounts,
  categories,
}: {
  readonly accounts: readonly Account[];
  readonly categories: readonly Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const isFirstRender = useRef(true);

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === ANY) params.delete(key);
        else params.set(key, value);
      }
      // Any filter change invalidates the current page number.
      if (!("page" in updates)) params.delete("page");
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams],
  );

  const apply = useCallback(
    (updates: Record<string, string | null>) => {
      router.push(buildUrl(updates), { scroll: false });
    },
    [router, buildUrl],
  );

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (term !== (searchParams.get("q") ?? "")) apply({ q: term || null });
    }, 350);
    return () => clearTimeout(timer);
  }, [term, apply, searchParams]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const kind = searchParams.get("type") ?? ANY;
  const account = searchParams.get("account") ?? ANY;
  const category = searchParams.get("category") ?? ANY;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const activeCount = FILTER_KEYS.filter((key) =>
    Boolean(searchParams.get(key)),
  ).length;
  const hasAny = activeCount > 0 || Boolean(searchParams.get("q"));

  const clearAll = () => {
    setTerm("");
    setSheetOpen(false);
    router.push(pathname, { scroll: false });
  };

  const controls = (
    <>
      <Field label="Type" htmlFor="filter-type">
        <Select value={kind} onValueChange={(value) => apply({ type: value })}>
          <SelectTrigger id="filter-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Account" htmlFor="filter-account">
        <Select
          value={account}
          onValueChange={(value) => apply({ account: value })}
        >
          <SelectTrigger id="filter-account">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All accounts</SelectItem>
            {accounts.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Category" htmlFor="filter-category">
        <Select
          value={category}
          onValueChange={(value) => apply({ category: value })}
        >
          <SelectTrigger id="filter-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All categories</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="From" htmlFor="filter-from">
        <Input
          id="filter-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => apply({ from: event.target.value || null })}
        />
      </Field>

      <Field label="To" htmlFor="filter-to">
        <Input
          id="filter-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => apply({ to: event.target.value || null })}
        />
      </Field>
    </>
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-3 shadow-card sm:p-4">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="filter-search" className="sr-only">
            Search transactions
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted"
            aria-hidden
          />
          <Input
            id="filter-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search transactions…"
            className="pl-10"
          />
        </div>

        {/* Sheet trigger, phones only. */}
        <Button
          type="button"
          variant="secondary"
          onClick={() => setSheetOpen(true)}
          className="shrink-0 lg:hidden"
          aria-label={
            activeCount > 0
              ? `Filters, ${activeCount} active`
              : "Filters"
          }
        >
          <SlidersHorizontal aria-hidden />
          {activeCount > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-pill bg-brand-900 text-[11px] font-semibold text-content-inverse">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </div>

      {/* Inline controls from `lg` up, matching the desktop design. */}
      <div className="mt-4 hidden items-end gap-4 lg:flex lg:flex-wrap">
        {controls}
        {hasAny ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            <X aria-hidden />
            Clear filters
          </Button>
        ) : null}
      </div>

      {/* Bottom sheet, phones and tablets. */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 size-full cursor-default bg-foreground/40 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter transactions"
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] animate-slide-up overflow-y-auto rounded-t-lg bg-surface pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-border-light bg-surface px-5 py-4">
              <h2 className="text-h3 font-semibold text-content">Filters</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="rounded-sm text-content-muted transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">{controls}</div>

            <div className="flex gap-3 border-t border-border-light px-5 py-4">
              {hasAny ? (
                <Button
                  type="button"
                  variant="secondary"
                  full
                  onClick={clearAll}
                >
                  Clear all
                </Button>
              ) : null}
              <Button type="button" full onClick={() => setSheetOpen(false)}>
                Show results
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  readonly label: string;
  readonly htmlFor: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5 lg:w-[170px]")}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
