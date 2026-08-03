import {
  ArrowLeftRight,
  LayoutDashboard,
  Settings,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

/**
 * The MVP navigation. The Pencil design also shows Budgets and Reports; those
 * features aren't built, so they aren't listed — a nav entry that leads
 * nowhere is worse than an absent one.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/settings", label: "Settings", icon: Settings },
];
