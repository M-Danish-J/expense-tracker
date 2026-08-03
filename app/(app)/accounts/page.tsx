import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { getSessionContext } from "@/lib/workspace";
import {
  buildCategoryTree,
  getAccountBalances,
  getCategories,
  getAccounts,
} from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, parseMoney, sumMoney } from "@/lib/money";
import { ACCOUNT_TYPE_LABELS, canWrite, type AccountType } from "@/lib/db/types";
import { Header } from "@/components/app/header";
import { AddTransactionButton } from "@/components/app/add-transaction-button";
import { NewAccountButton } from "@/components/accounts/account-dialog";
import { AccountRowActions } from "@/components/accounts/account-row-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountsSkeleton />}>
      <AccountsContent />
    </Suspense>
  );
}

async function AccountsContent() {
  const session = await getSessionContext();
  const workspaceId = session.workspace.id;

  const [balances, accounts, categories, usedAccountIds] = await Promise.all([
    getAccountBalances(workspaceId),
    getAccounts(workspaceId),
    getCategories(workspaceId, { activeOnly: true }),
    getUsedAccountIds(workspaceId),
  ]);

  const writable = canWrite(session.role);
  const categoryTree = buildCategoryTree(categories);
  const active = balances.filter((row) => row.is_active);
  const inactive = balances.filter((row) => !row.is_active);

  const netWorth = sumMoney(active.map((row) => parseMoney(row.balance)));

  return (
    <>
      <Header
        session={session}
        title="Accounts"
        subtitle="Every place your money lives."
        actions={
          writable ? (
            <div className="flex items-center gap-2">
              <NewAccountButton currency={session.currency} variant="secondary" />
              <AddTransactionButton
                accounts={accounts}
                categories={categoryTree}
                currency={session.currency}
                compact
              />
            </div>
          ) : null
        }
      />

      <main className="px-4 py-lg sm:px-lg">
        {balances.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface shadow-card">
            <EmptyState
              icon={Wallet}
              title="No accounts yet"
              description="Add your cash, bank or wallet accounts to start tracking where your money sits."
              action={
                writable ? (
                  <NewAccountButton currency={session.currency} label="Add your first account" />
                ) : null
              }
            />
          </div>
        ) : (
          <div className="space-y-xl">
            <section
              aria-labelledby="net-worth"
              className="rounded-lg border border-border bg-surface p-lg shadow-card"
            >
              <h2 id="net-worth" className="text-label font-medium text-content-secondary">
                Total across active accounts
              </h2>
              <p className="tabular mt-2 text-display font-bold text-content">
                {formatMoney(netWorth, session.currency)}
              </p>
            </section>

            <section aria-labelledby="active-accounts" className="space-y-md">
              <h2
                id="active-accounts"
                className="text-overline uppercase text-content-muted"
              >
                Active
              </h2>
              <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
                {active.map((row) => (
                  <AccountCard
                    key={row.account_id}
                    row={row}
                    currency={session.currency}
                    writable={writable}
                    hasHistory={usedAccountIds.has(row.account_id ?? "")}
                  />
                ))}
              </div>
              {active.length === 0 ? (
                <p className="text-body text-content-secondary">
                  All accounts are currently deactivated.
                </p>
              ) : null}
            </section>

            {inactive.length > 0 ? (
              <section aria-labelledby="inactive-accounts" className="space-y-md">
                <h2
                  id="inactive-accounts"
                  className="text-overline uppercase text-content-muted"
                >
                  Deactivated
                </h2>
                <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
                  {inactive.map((row) => (
                    <AccountCard
                      key={row.account_id}
                      row={row}
                      currency={session.currency}
                      writable={writable}
                      hasHistory={usedAccountIds.has(row.account_id ?? "")}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}

function AccountCard({
  row,
  currency,
  writable,
  hasHistory,
}: {
  readonly row: {
    account_id: string | null;
    name: string | null;
    type: string | null;
    is_active: boolean | null;
    balance: string | null;
    initial_balance: string | null;
  };
  readonly currency: string;
  readonly writable: boolean;
  readonly hasHistory: boolean;
}) {
  const id = row.account_id ?? "";
  const balance = parseMoney(row.balance);
  const typeLabel =
    ACCOUNT_TYPE_LABELS[(row.type ?? "other") as AccountType] ?? "Other";

  return (
    <article className="rounded-lg border border-border bg-surface p-lg shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/accounts/${id}`}
            className="block truncate text-h3 font-medium text-content hover:text-brand-900 focus-visible:outline-none focus-visible:underline"
          >
            {row.name}
          </Link>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="neutral">{typeLabel}</Badge>
            {row.is_active ? null : <Badge variant="warning">Inactive</Badge>}
          </div>
        </div>
        {writable ? (
          <AccountRowActions
            currency={currency}
            hasHistory={hasHistory}
            account={{
              id,
              name: row.name ?? "",
              type: row.type ?? "other",
              initial_balance: row.initial_balance ?? "0",
              is_active: row.is_active ?? true,
            }}
          />
        ) : null}
      </div>

      <p
        className={`tabular mt-lg text-stat font-bold ${
          balance < 0n ? "text-danger" : "text-content"
        }`}
      >
        {formatMoney(balance, currency)}
      </p>
      <Link
        href={`/accounts/${id}`}
        className="mt-1 inline-block text-caption text-content-secondary hover:text-brand-900"
      >
        View transactions →
      </Link>
    </article>
  );
}

/** Accounts referenced by any transaction or transfer can't be hard-deleted. */
async function getUsedAccountIds(workspaceId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const [{ data: txRows }, { data: transferRows }] = await Promise.all([
    supabase
      .from("transactions")
      .select("account_id")
      .eq("workspace_id", workspaceId),
    supabase
      .from("transfers")
      .select("from_account_id, to_account_id")
      .eq("workspace_id", workspaceId),
  ]);

  const used = new Set<string>();
  for (const row of txRows ?? []) used.add(row.account_id);
  for (const row of transferRows ?? []) {
    used.add(row.from_account_id);
    used.add(row.to_account_id);
  }
  return used;
}

function AccountsSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3.5 sm:px-lg">
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="space-y-xl px-4 py-lg sm:px-lg">
        <Skeleton className="h-28 w-full rounded-lg" />
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    </>
  );
}
