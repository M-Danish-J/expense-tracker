import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { formatDate, formatDateShort } from "@/lib/dates";
import type {
  Account,
  CategoryTree,
  LedgerEntry,
  LedgerKind,
} from "@/lib/db/types";
import { KindBadge } from "@/components/transactions/kind-badge";
import { LedgerAmount } from "@/components/transactions/ledger-amount";
import { TransactionRowActions } from "@/components/transactions/transaction-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableShell,
} from "@/components/ui/table";

interface TransactionListProps {
  readonly rows: readonly LedgerEntry[];
  readonly accounts: readonly Account[];
  readonly categories: readonly CategoryTree[];
  readonly currency: string;
  readonly writable: boolean;
  readonly sort: "date" | "amount" | "description";
  readonly direction: "asc" | "desc";
  readonly sortHref: (column: "date" | "amount") => string;
}

/**
 * The ledger, rendered two ways from the same data.
 *
 * A table forced onto a 360px screen either clips columns or scrolls sideways,
 * and both hide the amount — the one number people are looking for. Below `md`
 * each entry becomes a self-contained card instead; from `md` up it is the
 * table from the Pencil design.
 */
export function TransactionList({
  rows,
  accounts,
  categories,
  currency,
  writable,
  sort,
  direction,
  sortHref,
}: TransactionListProps) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const kind = toKind(row.kind);
          return (
            <li
              key={`${kind}-${row.id}`}
              className="rounded-lg border border-border bg-surface p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium text-content">
                    {row.description ||
                      (kind === "transfer" ? "Transfer" : "—")}
                  </p>
                  <p className="mt-0.5 truncate text-caption text-content-secondary">
                    {kind === "transfer"
                      ? `${row.account_name} → ${row.to_account_name}`
                      : row.account_name}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  <LedgerAmount
                    amount={row.amount ?? "0"}
                    kind={kind}
                    currency={currency}
                    className="text-body"
                  />
                  {writable ? (
                    <TransactionRowActions
                      accounts={accounts}
                      categories={categories}
                      currency={currency}
                      draft={toDraft(row, kind)}
                    />
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <KindBadge kind={kind} />
                {row.category_name ? (
                  <Badge variant="category">{row.category_name}</Badge>
                ) : null}
                <span className="ml-auto text-caption text-content-secondary">
                  {row.entry_date ? formatDateShort(row.entry_date) : "—"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <TableShell className="hidden md:block">
        <Table>
          <TableHeader>
            <tr>
              <TableHead className="w-[130px]">
                <SortLink
                  href={sortHref("date")}
                  active={sort === "date"}
                  direction={direction}
                >
                  Date
                </SortLink>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden w-[170px] lg:table-cell">
                Category
              </TableHead>
              <TableHead className="w-[170px]">Account</TableHead>
              <TableHead className="hidden w-[130px] lg:table-cell">
                Type
              </TableHead>
              <TableHead className="w-[140px] text-right">
                <SortLink
                  href={sortHref("amount")}
                  active={sort === "amount"}
                  direction={direction}
                  align="right"
                >
                  Amount
                </SortLink>
              </TableHead>
              {writable ? (
                <TableHead className="w-[56px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null}
            </tr>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const kind = toKind(row.kind);
              return (
                <TableRow key={`${kind}-${row.id}`}>
                  <TableCell className="whitespace-nowrap text-content-secondary">
                    {row.entry_date ? formatDate(row.entry_date) : "—"}
                  </TableCell>

                  <TableCell className="max-w-0 font-medium">
                    <span className="block truncate">
                      {row.description ||
                        (kind === "transfer" ? "Transfer" : "—")}
                    </span>
                    <span className="block truncate text-caption font-normal text-content-secondary lg:hidden">
                      {row.category_name ?? ""}
                    </span>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    {row.category_name ? (
                      <Badge variant="category">{row.category_name}</Badge>
                    ) : (
                      <span className="text-content-muted">—</span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-0 text-content-secondary">
                    <span className="block truncate">
                      {kind === "transfer"
                        ? `${row.account_name} → ${row.to_account_name}`
                        : row.account_name}
                    </span>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <KindBadge kind={kind} />
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-right">
                    <LedgerAmount
                      amount={row.amount ?? "0"}
                      kind={kind}
                      currency={currency}
                    />
                  </TableCell>

                  {writable ? (
                    <TableCell className="text-right">
                      <TransactionRowActions
                        accounts={accounts}
                        categories={categories}
                        currency={currency}
                        draft={toDraft(row, kind)}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableShell>
    </>
  );
}

function SortLink({
  href,
  active,
  direction,
  align = "left",
  children,
}: {
  readonly href: string;
  readonly active: boolean;
  readonly direction: "asc" | "desc";
  readonly align?: "left" | "right";
  readonly children: React.ReactNode;
}) {
  const Icon = direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link
      href={href}
      scroll={false}
      className={`inline-flex items-center gap-1 transition-colors hover:text-content ${
        align === "right" ? "flex-row-reverse" : ""
      } ${active ? "text-content" : ""}`}
    >
      {children}
      {active ? <Icon className="size-3" aria-hidden /> : null}
    </Link>
  );
}

function toDraft(row: LedgerEntry, kind: LedgerKind) {
  return {
    id: row.id ?? "",
    kind,
    amount: row.amount ?? "0",
    entry_date: row.entry_date ?? "",
    description: row.description,
    notes: row.notes,
    account_id: row.account_id,
    to_account_id: row.to_account_id,
    category_id: row.category_id,
  };
}

function toKind(kind: string | null): LedgerKind {
  if (kind === "income" || kind === "transfer") return kind;
  return "expense";
}
