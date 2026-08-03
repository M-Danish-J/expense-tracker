import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";

import { getSessionContext } from "@/lib/workspace";
import {
  buildCategoryTree,
  getAccountBalance,
  getAccounts,
  getCategories,
  getLedgerPage,
} from "@/lib/db/queries";
import { formatMoney, parseMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { ACCOUNT_TYPE_LABELS, canWrite, type AccountType } from "@/lib/db/types";
import { Header } from "@/components/app/header";
import { AddTransactionButton } from "@/components/app/add-transaction-button";
import { KindBadge } from "@/components/transactions/kind-badge";
import { LedgerAmount } from "@/components/transactions/ledger-amount";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableShell,
} from "@/components/ui/table";

export default function AccountDetailPage({
  params,
}: {
  readonly params: Promise<{ accountId: string }>;
}) {
  // `params` is dynamic under cacheComponents, so it must be awaited *inside*
  // the boundary — awaiting it here would block the whole route from streaming.
  return (
    <Suspense fallback={<AccountDetailSkeleton />}>
      <AccountDetail params={params} />
    </Suspense>
  );
}

async function AccountDetail({
  params,
}: {
  readonly params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const session = await getSessionContext();
  const workspaceId = session.workspace.id;

  const account = await getAccountBalance(workspaceId, accountId);
  if (!account) notFound();

  const [ledger, accounts, categories] = await Promise.all([
    getLedgerPage(workspaceId, {
      accountId,
      pageSize: 25,
      sort: "date",
      direction: "desc",
    }),
    getAccounts(workspaceId),
    getCategories(workspaceId, { activeOnly: true }),
  ]);

  const balance = parseMoney(account.balance);
  const writable = canWrite(session.role);
  const typeLabel =
    ACCOUNT_TYPE_LABELS[(account.type ?? "other") as AccountType] ?? "Other";

  return (
    <>
      <Header
        session={session}
        title={account.name ?? "Account"}
        subtitle={`${typeLabel} · ${session.currency}`}
        actions={
          writable ? (
            <AddTransactionButton
              accounts={accounts}
              categories={buildCategoryTree(categories)}
              currency={session.currency}
              compact
            />
          ) : null
        }
      />

      <main className="space-y-lg px-4 py-lg sm:px-lg">
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1.5 text-body text-content-secondary transition-colors hover:text-brand-900"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All accounts
        </Link>

        <section className="grid gap-md sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-lg shadow-card">
            <p className="text-label font-medium text-content-secondary">
              Current balance
            </p>
            <p
              className={`tabular mt-2 text-display font-bold ${
                balance < 0n ? "text-danger" : "text-content"
              }`}
            >
              {formatMoney(balance, session.currency)}
            </p>
            {account.is_active ? null : (
              <Badge variant="warning" className="mt-3">
                Deactivated
              </Badge>
            )}
          </div>
          <div className="rounded-lg border border-border bg-surface p-lg shadow-card">
            <p className="text-label font-medium text-content-secondary">
              Opening balance
            </p>
            <p className="tabular mt-2 text-stat font-bold text-content">
              {formatMoney(parseMoney(account.initial_balance), session.currency)}
            </p>
            <p className="mt-1.5 text-caption text-content-secondary">
              {ledger.total} {ledger.total === 1 ? "entry" : "entries"} since then
            </p>
          </div>
        </section>

        <section aria-labelledby="account-activity" className="space-y-md">
          <h2 id="account-activity" className="text-h3 font-medium text-content">
            Activity
          </h2>

          {ledger.rows.length === 0 ? (
            <TableShell>
              <EmptyState
                icon={Receipt}
                title="Nothing here yet"
                description="Transactions and transfers involving this account will appear here."
              />
            </TableShell>
          ) : (
            <TableShell>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {ledger.rows.map((row) => {
                    // For a transfer, this account is on one side or the other.
                    const isOutgoing = row.account_id === accountId;
                    return (
                      <TableRow key={`${row.kind}-${row.id}`}>
                        <TableCell className="whitespace-nowrap text-content-secondary">
                          {row.entry_date ? formatDate(row.entry_date) : "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.description || "—"}
                          {row.kind === "transfer" ? (
                            <span className="block text-caption font-normal text-content-secondary">
                              {isOutgoing
                                ? `To ${row.to_account_name}`
                                : `From ${row.account_name}`}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {row.category_name ? (
                            <Badge variant="category">{row.category_name}</Badge>
                          ) : (
                            <span className="text-content-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <KindBadge kind={toKind(row.kind)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <AccountRelativeAmount
                            amount={row.amount ?? "0"}
                            kind={toKind(row.kind)}
                            isOutgoing={isOutgoing}
                            currency={session.currency}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableShell>
          )}

          {ledger.total > ledger.rows.length ? (
            <p className="text-body text-content-secondary">
              Showing the {ledger.rows.length} most recent of {ledger.total}.{" "}
              <Link
                href={`/transactions?account=${accountId}`}
                className="text-brand-900 hover:underline"
              >
                See all in Transactions →
              </Link>
            </p>
          ) : null}
        </section>
      </main>
    </>
  );
}

/**
 * On an account page a transfer isn't neutral — it left this account or arrived
 * in it, so it is signed from this account's point of view.
 */
function AccountRelativeAmount({
  amount,
  kind,
  isOutgoing,
  currency,
}: {
  readonly amount: string;
  readonly kind: "income" | "expense" | "transfer";
  readonly isOutgoing: boolean;
  readonly currency: string;
}) {
  if (kind !== "transfer") {
    return <LedgerAmount amount={amount} kind={kind} currency={currency} />;
  }

  const value = parseMoney(amount);
  return (
    <span
      className={`tabular font-semibold ${isOutgoing ? "text-danger" : "text-success"}`}
    >
      {formatMoney(isOutgoing ? -value : value, currency, { signed: true })}
    </span>
  );
}

function toKind(kind: string | null): "income" | "expense" | "transfer" {
  if (kind === "income" || kind === "transfer") return kind;
  return "expense";
}

function AccountDetailSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3.5 sm:px-lg">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="space-y-lg px-4 py-lg sm:px-lg">
        <div className="grid gap-md sm:grid-cols-2">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    </>
  );
}
