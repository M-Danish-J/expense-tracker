import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Receipt, SearchX } from "lucide-react";

import { getSessionContext } from "@/lib/workspace";
import {
  buildCategoryTree,
  DEFAULT_PAGE_SIZE,
  getAccounts,
  getCategories,
  getLedgerPage,
  type LedgerFilters,
} from "@/lib/db/queries";
import { isValidIsoDate } from "@/lib/dates";
import { canWrite, LEDGER_KINDS, type LedgerKind } from "@/lib/db/types";
import { Header } from "@/components/app/header";
import { AddTransactionButton } from "@/components/app/add-transaction-button";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Pagination } from "@/components/transactions/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { TableShell } from "@/components/ui/table";

export const metadata: Metadata = { title: "Transactions" };

type SearchParams = Record<string, string | string[] | undefined>;

export default function TransactionsPage({
  searchParams,
}: {
  readonly searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TransactionsContent({
  searchParams,
}: {
  readonly searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await getSessionContext();
  const workspaceId = session.workspace.id;

  const filters = parseFilters(params);

  const [ledger, accounts, categories] = await Promise.all([
    getLedgerPage(workspaceId, filters),
    getAccounts(workspaceId),
    getCategories(workspaceId),
  ]);

  const writable = canWrite(session.role);
  const activeCategories = categories.filter((c) => c.is_active);
  const categoryTree = buildCategoryTree(activeCategories);
  const hasFilters = hasActiveFilters(params);

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value) next.set(key, value);
    }
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    const query = next.toString();
    return query ? `/transactions?${query}` : "/transactions";
  };

  const sortHref = (column: "date" | "amount") => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value) next.set(key, value);
    }
    const isCurrent = (filters.sort ?? "date") === column;
    next.set("sort", column);
    next.set(
      "dir",
      isCurrent && filters.direction === "desc" ? "asc" : "desc",
    );
    next.delete("page");
    return `/transactions?${next.toString()}`;
  };

  return (
    <>
      <Header
        session={session}
        title="Transactions"
        subtitle="Every expense, income and transfer in this workspace."
        actions={
          writable ? (
            <AddTransactionButton
              accounts={accounts}
              categories={categoryTree}
              currency={session.currency}
              compact
            />
          ) : null
        }
      />

      <main className="space-y-lg px-4 py-lg sm:px-lg">
        <TransactionFilters
          accounts={accounts}
          categories={activeCategories}
        />

        {ledger.rows.length === 0 ? (
          <TableShell>
            {hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="No matching transactions"
                description="Nothing matches these filters. Try widening the date range or clearing the search."
                action={
                  <Link
                    href="/transactions"
                    className="text-body font-medium text-brand-900 hover:underline"
                  >
                    Clear all filters
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Start tracking your spending by adding your first transaction."
                action={
                  writable ? (
                    <AddTransactionButton
                      accounts={accounts}
                      categories={categoryTree}
                      currency={session.currency}
                    />
                  ) : null
                }
              />
            )}
          </TableShell>
        ) : (
          <>
            <TransactionList
              rows={ledger.rows}
              accounts={accounts}
              categories={categoryTree}
              currency={session.currency}
              writable={writable}
              sort={filters.sort ?? "date"}
              direction={filters.direction ?? "desc"}
              sortHref={sortHref}
            />

            <Pagination
              page={ledger.page}
              pageCount={ledger.pageCount}
              total={ledger.total}
              pageSize={ledger.pageSize}
              buildHref={buildHref}
            />
          </>
        )}
      </main>
    </>
  );
}

/** URL params are untrusted input; anything unrecognised is simply dropped. */
function parseFilters(params: SearchParams): LedgerFilters {
  const read = (key: string): string | undefined => {
    const value = params[key];
    return typeof value === "string" && value ? value : undefined;
  };

  const kind = read("type");
  const sort = read("sort");
  const dir = read("dir");
  const page = Number.parseInt(read("page") ?? "1", 10);
  const from = read("from");
  const to = read("to");

  return {
    q: read("q"),
    kind: LEDGER_KINDS.includes(kind as LedgerKind)
      ? (kind as LedgerKind)
      : undefined,
    accountId: isUuid(read("account")) ? read("account") : undefined,
    categoryId: isUuid(read("category")) ? read("category") : undefined,
    from: from && isValidIsoDate(from) ? from : undefined,
    to: to && isValidIsoDate(to) ? to : undefined,
    sort: sort === "amount" || sort === "description" ? sort : "date",
    direction: dir === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

function isUuid(value: string | undefined): boolean {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

/**
 * Which params actually narrow the result set — paging and sorting don't, so
 * they shouldn't turn the "no transactions yet" empty state into "no matches".
 */
const FILTER_PARAMS = ["q", "type", "account", "category", "from", "to"];

function hasActiveFilters(params: SearchParams): boolean {
  return FILTER_PARAMS.some((key) => Boolean(params[key]));
}

function TransactionsSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3.5 sm:px-lg">
        <div className="h-8 w-44 animate-pulse rounded-md bg-surface-tertiary/70" />
      </div>
      <div className="space-y-lg px-4 py-lg sm:px-lg">
        <div className="h-32 animate-pulse rounded-lg bg-surface-tertiary/40" />
        <TableSkeleton rows={8} />
      </div>
    </>
  );
}
