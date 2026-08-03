import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { getSessionContext } from "@/lib/workspace";
import {
  buildCategoryTree,
  getAccountBalances,
  getAccounts,
  getCategories,
  getDashboardSummary,
  getIncomeExpenseSeries,
  getRecentLedger,
  getSpendingByCategory,
} from "@/lib/db/queries";
import { formatMoney, parseMoney } from "@/lib/money";
import {
  formatDateShort,
  greetingFor,
  isPeriodKey,
  resolvePeriod,
  type PeriodKey,
} from "@/lib/dates";
import {
  ACCOUNT_TYPE_LABELS,
  canWrite,
  type AccountType,
  type LedgerKind,
} from "@/lib/db/types";
import { Header } from "@/components/app/header";
import { AddTransactionButton } from "@/components/app/add-transaction-button";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { KindBadge } from "@/components/transactions/kind-badge";
import { LedgerAmount } from "@/components/transactions/ledger-amount";
import { NewAccountButton } from "@/components/accounts/account-dialog";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ChartSkeleton,
  Skeleton,
  StatCardSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Dashboard" };

type SearchParams = Record<string, string | string[] | undefined>;

export default function DashboardPage({
  searchParams,
}: {
  readonly searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({
  searchParams,
}: {
  readonly searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await getSessionContext();
  const workspaceId = session.workspace.id;

  const periodParam = typeof params.period === "string" ? params.period : undefined;
  const period: PeriodKey = isPeriodKey(periodParam) ? periodParam : "this_month";
  const range = resolvePeriod(period);

  const [summary, series, byCategory, balances, recent, accounts, categories] =
    await Promise.all([
      getDashboardSummary(workspaceId, range.from, range.to),
      getIncomeExpenseSeries(workspaceId, range.from, range.to, range.granularity),
      getSpendingByCategory(workspaceId, range.from, range.to),
      getAccountBalances(workspaceId),
      getRecentLedger(workspaceId, 5),
      getAccounts(workspaceId),
      getCategories(workspaceId, { activeOnly: true }),
    ]);

  const writable = canWrite(session.role);
  const categoryTree = buildCategoryTree(categories);
  const currency = session.currency;
  const activeAccounts = balances.filter((row) => row.is_active);

  const firstName = session.profile.full_name?.split(" ")[0] ?? "";
  const greeting = greetingFor(session.profile.timezone);
  const net = parseMoney(summary.net);
  const hasChartData = series.some(
    (point) => parseMoney(point.income) > 0n || parseMoney(point.expenses) > 0n,
  );

  return (
    <>
      <Header
        session={session}
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle="Here's what's happening with your money."
        actions={
          <div className="flex items-center gap-2">
            <PeriodSelector value={period} />
            {writable ? (
              <AddTransactionButton
                accounts={accounts}
                categories={categoryTree}
                currency={currency}
                compact
              />
            ) : null}
          </div>
        }
      />

      <main className="space-y-lg px-4 py-lg sm:px-lg">
        <section aria-label="Summary" className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total balance"
            value={formatMoney(parseMoney(summary.total_balance), currency)}
            icon={Wallet}
            tone="brand"
            caption="Across all accounts"
          />
          <StatCard
            label="Income"
            value={formatMoney(parseMoney(summary.income), currency)}
            icon={TrendingUp}
            tone="success"
            caption={range.label}
          />
          <StatCard
            label="Expenses"
            value={formatMoney(parseMoney(summary.expenses), currency)}
            icon={TrendingDown}
            tone="danger"
            caption={range.label}
          />
          <StatCard
            label="Savings rate"
            value={`${Number(summary.savings_rate ?? 0).toFixed(1)}%`}
            icon={PiggyBank}
            tone={net < 0n ? "danger" : "info"}
            caption={`${formatMoney(net, currency, { signed: true })} net`}
          />
        </section>

        <section className="grid gap-md xl:grid-cols-[1.6fr_1fr]">
          <article className="rounded-lg border border-border bg-surface p-lg shadow-card">
            <div className="mb-lg flex items-center justify-between gap-4">
              <h2 className="text-h3 font-medium text-content">
                Income vs Expenses
              </h2>
              <div className="flex items-center gap-4 text-caption text-content-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-brand-900" aria-hidden />
                  Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-danger" aria-hidden />
                  Expenses
                </span>
              </div>
            </div>
            {hasChartData ? (
              <IncomeExpenseChart
                data={series}
                currency={currency}
                granularity={range.granularity}
              />
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No activity in this period"
                description="Add a transaction or pick a wider period to see the comparison."
                className="py-xl"
              />
            )}
          </article>

          <article className="rounded-lg border border-border bg-surface p-lg shadow-card">
            <h2 className="mb-lg text-h3 font-medium text-content">
              Spending by Category
            </h2>
            {byCategory.length > 0 ? (
              <CategoryDonut data={byCategory} currency={currency} />
            ) : (
              <EmptyState
                icon={Receipt}
                title="No spending yet"
                description="Once you record expenses, the breakdown appears here."
                className="py-xl"
              />
            )}
          </article>
        </section>

        <section className="grid gap-md xl:grid-cols-[1fr_1.6fr]">
          <article className="rounded-lg border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between gap-4 px-lg pb-md pt-lg">
              <h2 className="text-h3 font-medium text-content">Accounts</h2>
              {writable ? (
                <NewAccountButton currency={currency} label="+ Add" variant="secondary" />
              ) : null}
            </div>

            {activeAccounts.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No active accounts"
                description="Add an account to start tracking balances."
                className="py-xl"
                action={
                  writable ? (
                    <NewAccountButton currency={currency} label="Add account" />
                  ) : null
                }
              />
            ) : (
              <ul className="divide-y divide-border-light">
                {activeAccounts.map((row) => {
                  const balance = parseMoney(row.balance);
                  return (
                    <li key={row.account_id}>
                      <Link
                        href={`/accounts/${row.account_id}`}
                        className="flex items-center justify-between gap-3 px-lg py-3.5 transition-colors hover:bg-surface-secondary/60"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-body font-medium text-content">
                            {row.name}
                          </span>
                          <span className="block text-caption text-content-secondary">
                            {ACCOUNT_TYPE_LABELS[
                              (row.type ?? "other") as AccountType
                            ] ?? "Other"}
                          </span>
                        </span>
                        <span
                          className={`tabular shrink-0 text-body font-semibold ${
                            balance < 0n ? "text-danger" : "text-content"
                          }`}
                        >
                          {formatMoney(balance, currency)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="rounded-lg border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between gap-4 px-lg pb-md pt-lg">
              <h2 className="text-h3 font-medium text-content">
                Recent Transactions
              </h2>
              <Link
                href="/transactions"
                className="inline-flex items-center gap-1 text-caption font-medium text-brand-900 hover:underline"
              >
                View all
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Start tracking your spending by adding your first transaction."
                className="py-xl"
                action={
                  writable ? (
                    <AddTransactionButton
                      accounts={accounts}
                      categories={categoryTree}
                      currency={currency}
                    />
                  ) : null
                }
              />
            ) : (
              <ul className="divide-y divide-border-light">
                {recent.map((row) => {
                  const kind = toKind(row.kind);
                  return (
                    <li
                      key={`${kind}-${row.id}`}
                      className="flex items-center gap-3 px-lg py-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body font-medium text-content">
                          {row.description ||
                            (kind === "transfer" ? "Transfer" : "—")}
                        </p>
                        <p className="truncate text-caption text-content-secondary">
                          {kind === "transfer"
                            ? `${row.account_name} → ${row.to_account_name}`
                            : [row.category_name, row.account_name]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                      </div>
                      <div className="hidden shrink-0 sm:block">
                        <KindBadge kind={kind} />
                      </div>
                      <div className="shrink-0 text-right">
                        <LedgerAmount
                          amount={row.amount ?? "0"}
                          kind={kind}
                          currency={currency}
                          className="text-body"
                        />
                        <p className="text-caption text-content-secondary">
                          {row.entry_date ? formatDateShort(row.entry_date) : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>
      </main>
    </>
  );
}

function toKind(kind: string | null): LedgerKind {
  if (kind === "income" || kind === "transfer") return kind;
  return "expense";
}

function DashboardSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3.5 sm:px-lg">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="space-y-lg px-4 py-lg sm:px-lg">
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-md xl:grid-cols-[1.6fr_1fr]">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid gap-md xl:grid-cols-[1fr_1.6fr]">
          <Skeleton className="h-72 rounded-lg" />
          <TableSkeleton rows={5} />
        </div>
      </div>
    </>
  );
}
