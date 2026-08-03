import type { Database } from "@/lib/db/database.types";

type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];
type Functions = Database["public"]["Functions"];

export type Profile = Tables["profiles"]["Row"];
export type Workspace = Tables["workspaces"]["Row"];
export type WorkspaceMember = Tables["workspace_members"]["Row"];
export type Account = Tables["accounts"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Transaction = Tables["transactions"]["Row"];
export type Transfer = Tables["transfers"]["Row"];

export type AccountBalance = Views["account_balances"]["Row"];
export type LedgerEntry = Views["ledger_entries"]["Row"];

export type DashboardSummary = Functions["get_dashboard_summary"]["Returns"][number];
export type SeriesPoint = Functions["get_income_expense_series"]["Returns"][number];
export type CategorySpend = Functions["get_spending_by_category"]["Returns"][number];

/** Roles, mirroring the workspace_members CHECK constraint. */
export const WORKSPACE_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** Account types, mirroring the accounts CHECK constraint. */
export const ACCOUNT_TYPES = [
  "cash",
  "bank",
  "credit_card",
  "wallet",
  "savings",
  "investment",
  "other",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Cash",
  bank: "Bank account",
  credit_card: "Credit card",
  wallet: "Mobile wallet",
  savings: "Savings",
  investment: "Investment",
  other: "Other",
};

export const CATEGORY_TYPES = ["expense", "income"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

/** What a row in the unified feed can be. */
export const LEDGER_KINDS = ["income", "expense", "transfer"] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];

/** Roles permitted to create or modify financial data. */
export function canWrite(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

/** Roles permitted to administer the workspace itself. */
export function canAdmin(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** A category with its children attached, for grouped pickers and the tree UI. */
export interface CategoryTree extends Category {
  children: Category[];
}

/** An account joined to its computed balance. */
export interface AccountWithBalance extends Account {
  balance: string;
}
