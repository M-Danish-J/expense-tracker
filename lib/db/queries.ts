import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Account,
  AccountBalance,
  Category,
  CategorySpend,
  CategoryTree,
  CategoryType,
  DashboardSummary,
  LedgerEntry,
  LedgerKind,
  SeriesPoint,
} from "@/lib/db/types";
import type { IsoDate } from "@/lib/dates";

/**
 * Every read the application performs. Each one is scoped by workspace_id and
 * runs through RLS, so a wrong id returns nothing rather than someone else's
 * data.
 */

export async function getAccounts(workspaceId: string): Promise<Account[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_active", { ascending: false })
    .order("name");
  return data ?? [];
}

export async function getAccountBalances(
  workspaceId: string,
): Promise<AccountBalance[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_balances")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_active", { ascending: false })
    .order("name");
  return data ?? [];
}

export async function getAccountBalance(
  workspaceId: string,
  accountId: string,
): Promise<AccountBalance | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_balances")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("account_id", accountId)
    .maybeSingle();
  return data;
}

export async function getCategories(
  workspaceId: string,
  options: { readonly activeOnly?: boolean; readonly type?: CategoryType } = {},
): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (options.activeOnly) query = query.eq("is_active", true);
  if (options.type) query = query.eq("type", options.type);

  const { data } = await query.order("name");
  return data ?? [];
}

/** Nests categories one level deep — the depth the schema's trigger enforces. */
export function buildCategoryTree(
  categories: readonly Category[],
): CategoryTree[] {
  const roots = categories.filter((c) => c.parent_id === null);
  const byParent = new Map<string, Category[]>();

  for (const category of categories) {
    if (!category.parent_id) continue;
    const siblings = byParent.get(category.parent_id) ?? [];
    siblings.push(category);
    byParent.set(category.parent_id, siblings);
  }

  return roots.map((root) => ({
    ...root,
    children: byParent.get(root.id) ?? [],
  }));
}

/** How many transactions reference each category — drives the delete guard. */
export async function getCategoryUsage(
  workspaceId: string,
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("category_id")
    .eq("workspace_id", workspaceId)
    .not("category_id", "is", null);

  const usage = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.category_id) continue;
    usage.set(row.category_id, (usage.get(row.category_id) ?? 0) + 1);
  }
  return usage;
}

export interface LedgerFilters {
  readonly q?: string;
  readonly kind?: LedgerKind;
  readonly accountId?: string;
  readonly categoryId?: string;
  readonly from?: IsoDate;
  readonly to?: IsoDate;
  readonly sort?: "date" | "amount" | "description";
  readonly direction?: "asc" | "desc";
  readonly page?: number;
  readonly pageSize?: number;
}

export interface LedgerPage {
  readonly rows: LedgerEntry[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
}

export const DEFAULT_PAGE_SIZE = 20;

/**
 * The transactions feed: one query against the `ledger_entries` view so
 * transactions and transfers filter, sort and paginate together. Only the rows
 * actually shown are fetched — the database does the work, not the browser.
 */
export async function getLedgerPage(
  workspaceId: string,
  filters: LedgerFilters = {},
): Promise<LedgerPage> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  let query = supabase
    .from("ledger_entries")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId);

  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.from) query = query.gte("entry_date", filters.from);
  if (filters.to) query = query.lte("entry_date", filters.to);

  // An account filter has to match either side of a transfer.
  if (filters.accountId) {
    query = query.or(
      `account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`,
    );
  }

  // Transfers carry no category, so a category filter naturally excludes them.
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);

  if (filters.q) {
    const term = escapeForOr(filters.q);
    if (term) {
      query = query.or(
        `description.ilike.%${term}%,notes.ilike.%${term}%,account_name.ilike.%${term}%,category_name.ilike.%${term}%`,
      );
    }
  }

  const ascending = filters.direction === "asc";
  let sortColumn: "entry_date" | "amount" | "description" = "entry_date";
  if (filters.sort === "amount") sortColumn = "amount";
  else if (filters.sort === "description") sortColumn = "description";

  query = query
    .order(sortColumn, { ascending, nullsFirst: false })
    .order("created_at", { ascending })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count } = await query;
  const total = count ?? 0;

  return {
    rows: data ?? [],
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * PostgREST's `or` filter is comma and parenthesis delimited, so those
 * characters must not survive in user input or the search changes meaning.
 */
function escapeForOr(term: string): string {
  return term.replace(/[,()\\*]/g, " ").trim();
}

export async function getRecentLedger(
  workspaceId: string,
  limit = 5,
): Promise<LedgerEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getLedgerEntry(
  workspaceId: string,
  id: string,
): Promise<LedgerEntry | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  return data;
}

// ---------------------------------------------------------------------------
// Dashboard aggregates — computed in Postgres, never in the browser.
// ---------------------------------------------------------------------------

const EMPTY_SUMMARY: DashboardSummary = {
  total_balance: "0",
  income: "0",
  expenses: "0",
  net: "0",
  savings_rate: 0,
};

export async function getDashboardSummary(
  workspaceId: string,
  from: IsoDate,
  to: IsoDate,
): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_dashboard_summary", {
    p_workspace_id: workspaceId,
    p_from: from,
    p_to: to,
  });
  return data?.[0] ?? EMPTY_SUMMARY;
}

export async function getIncomeExpenseSeries(
  workspaceId: string,
  from: IsoDate,
  to: IsoDate,
  granularity: "day" | "month",
): Promise<SeriesPoint[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_income_expense_series", {
    p_workspace_id: workspaceId,
    p_from: from,
    p_to: to,
    p_granularity: granularity,
  });
  return data ?? [];
}

export async function getSpendingByCategory(
  workspaceId: string,
  from: IsoDate,
  to: IsoDate,
): Promise<CategorySpend[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_spending_by_category", {
    p_workspace_id: workspaceId,
    p_from: from,
    p_to: to,
  });
  return data ?? [];
}
