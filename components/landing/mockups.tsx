import {
  ArrowLeftRight,
  Banknote,
  LayoutDashboard,
  Landmark,
  Settings,
  Smartphone,
  Tags,
  Wallet,
} from "lucide-react";

/**
 * Illustrative product mockups for the landing page.
 *
 * Every figure here is a fixed placeholder on a signed-out marketing page — it
 * is not, and never claims to be, anyone's data. They are all `aria-hidden`
 * because a screen reader gains nothing from a decorative picture of a chart;
 * the surrounding prose carries the meaning.
 */

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ArrowLeftRight, label: "Transactions", active: false },
  { icon: Wallet, label: "Accounts", active: false },
  { icon: Tags, label: "Categories", active: false },
  { icon: Settings, label: "Settings", active: false },
];

/** The hero's full-app mockup: sidebar, stat cards, bar chart and donut. */
export function DashboardMockup() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.07)]"
    >
      <div className="flex">
        <MockSidebar />

        <div className="min-w-0 flex-1 space-y-4 bg-background p-4 sm:space-y-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-h3 font-semibold text-content">Dashboard</p>
            <p className="text-caption text-content-secondary">Jul 2026</p>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MockStat label="Total Balance" value="PKR 245,500" />
            <MockStat label="Income" value="PKR 185,000" tone="success" />
            <MockStat label="Expenses" value="PKR 92,500" tone="danger" />
            <MockStat label="Savings Rate" value="48.9%" tone="brand" />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-md border border-border bg-surface p-4">
              <p className="text-caption font-semibold text-content">
                Income vs Expenses
              </p>
              <div className="mt-4 flex h-28 items-end gap-2 sm:h-36">
                {[
                  [72, 46],
                  [58, 38],
                  [88, 62],
                  [64, 44],
                  [96, 70],
                  [80, 52],
                ].map(([income, expense]) => (
                  <div
                    key={`${income}-${expense}`}
                    className="flex h-full w-full items-end gap-1"
                  >
                    <span
                      className="w-full rounded-t-sm bg-brand-900"
                      style={{ height: `${income}%` }}
                    />
                    <span
                      className="w-full rounded-t-sm bg-danger"
                      style={{ height: `${expense}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden rounded-md border border-border bg-surface p-4 lg:block">
              <p className="text-caption font-semibold text-content">
                Spending by Category
              </p>
              <div className="mt-4 flex items-center gap-4">
                <MockDonut />
                <ul className="min-w-0 flex-1 space-y-1.5">
                  {[
                    ["Food & Dining", "32%", "bg-chart-1"],
                    ["Transport", "24%", "bg-chart-2"],
                    ["Housing", "18%", "bg-chart-3"],
                    ["Other", "26%", "bg-chart-6"],
                  ].map(([label, pct, colour]) => (
                    <li key={label} className="flex items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-sm ${colour}`} />
                      <span className="min-w-0 flex-1 truncate text-[11px] text-content-secondary">
                        {label}
                      </span>
                      <span className="text-[11px] font-medium text-content">
                        {pct}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockSidebar() {
  return (
    <div className="hidden w-[200px] shrink-0 space-y-1 bg-sidebar p-4 md:block">
      <div className="flex items-center gap-2.5 pb-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-surface">
          <Wallet className="size-4 text-brand-900" />
        </span>
        <span className="text-h3 font-semibold text-content-inverse">
          Expensio
        </span>
      </div>
      {SIDEBAR_ITEMS.map(({ icon: Icon, label, active }) => (
        <div
          key={label}
          className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-body ${
            active
              ? "bg-sidebar-active font-medium text-sidebar-text-active"
              : "text-sidebar-text"
          }`}
        >
          <Icon className="size-[18px] shrink-0" />
          {label}
        </div>
      ))}
    </div>
  );
}

function MockStat({
  label,
  value,
  tone = "default",
}: {
  readonly label: string;
  readonly value: string;
  readonly tone?: "default" | "success" | "danger" | "brand";
}) {
  const valueTone = {
    default: "text-content",
    success: "text-success",
    danger: "text-danger",
    brand: "text-brand-900",
  }[tone];

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="truncate text-[11px] font-medium text-content-secondary">
        {label}
      </p>
      <p className={`mt-1 truncate text-body font-bold sm:text-h3 ${valueTone}`}>
        {value}
      </p>
    </div>
  );
}

function MockDonut() {
  return (
    <div
      className="size-[84px] shrink-0 rounded-pill"
      style={{
        background:
          "conic-gradient(hsl(var(--chart-1)) 0 32%, hsl(var(--chart-2)) 32% 56%, hsl(var(--chart-3)) 56% 74%, hsl(var(--chart-6)) 74% 100%)",
      }}
    >
      <div className="flex size-full items-center justify-center">
        <div className="flex size-[54px] items-center justify-center rounded-pill bg-surface">
          <span className="text-[10px] font-semibold text-content">100%</span>
        </div>
      </div>
    </div>
  );
}

/** The transactions list beside "Every transaction. Right where it belongs." */
export function TransactionListMockup() {
  const rows = [
    { name: "Grocery Shopping", meta: "Food · Cash", amount: "-PKR 2,500", tone: "danger" },
    { name: "Salary", meta: "Income · Meezan Bank", amount: "+PKR 150,000", tone: "success" },
    { name: "Fuel", meta: "Transport · Cash", amount: "-PKR 4,500", tone: "danger" },
    { name: "Freelance Payment", meta: "Income · Easypaisa", amount: "+PKR 25,000", tone: "success" },
  ] as const;

  return (
    <div
      aria-hidden
      className="rounded-lg border border-border bg-surface p-5 shadow-raised sm:p-6"
    >
      <div className="flex items-center justify-between pb-4">
        <p className="text-h3 font-semibold text-content">Transactions</p>
        <p className="text-caption font-medium text-content-muted">This Month</p>
      </div>
      <ul className="divide-y divide-border-light border-t border-border-light">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3 py-3.5">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                row.tone === "danger" ? "bg-danger-light" : "bg-success-light"
              }`}
            >
              <ArrowLeftRight
                className={`size-4 ${
                  row.tone === "danger" ? "text-danger" : "text-success"
                }`}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-medium text-content">
                {row.name}
              </span>
              <span className="block truncate text-caption text-content-secondary">
                {row.meta}
              </span>
            </span>
            <span
              className={`shrink-0 text-body font-semibold ${
                row.tone === "danger" ? "text-danger" : "text-success"
              }`}
            >
              {row.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Account cards beside "Know exactly where your money lives." */
export function AccountCardsMockup() {
  const accounts = [
    { icon: Landmark, name: "Meezan Bank", type: "Bank Account", balance: "PKR 125,000", tone: "brand" },
    { icon: Banknote, name: "Cash", type: "Physical Cash", balance: "PKR 15,000", tone: "success" },
    { icon: Smartphone, name: "Easypaisa", type: "Mobile Wallet", balance: "PKR 5,500", tone: "info" },
  ] as const;

  const toneClasses = {
    brand: "bg-brand-50 text-brand-900",
    success: "bg-success-light text-success",
    info: "bg-info-light text-info",
  };

  return (
    <div aria-hidden className="space-y-4">
      {accounts.map(({ icon: Icon, name, type, balance, tone }) => (
        <div
          key={name}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5 shadow-card"
        >
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-md ${toneClasses[tone]}`}
          >
            <Icon className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-h3 font-semibold text-content">
              {name}
            </span>
            <span className="block text-label text-content-muted">{type}</span>
          </span>
          <span className="shrink-0 text-h3 font-bold text-content">
            {balance}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The insights panel beside "Turn transactions into clarity." */
export function InsightsMockup() {
  const bars = [90, 65, 110, 80, 120, 95];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return (
    <div
      aria-hidden
      className="rounded-lg border border-border bg-surface p-5 shadow-raised sm:p-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md bg-surface-secondary p-4">
          <p className="text-caption font-medium text-content-secondary">
            Monthly Income
          </p>
          <p className="mt-1 text-h2 font-bold text-success">PKR 185,000</p>
        </div>
        <div className="rounded-md bg-surface-secondary p-4">
          <p className="text-caption font-medium text-content-secondary">
            Monthly Expenses
          </p>
          <p className="mt-1 text-h2 font-bold text-danger">PKR 142,300</p>
        </div>
      </div>

      <p className="mt-5 text-body font-semibold text-content">
        Income vs Expenses
      </p>
      <div className="mt-4 flex h-32 items-end gap-3">
        {bars.map((height, index) => (
          <div key={months[index]} className="flex h-full w-full flex-col justify-end gap-1.5">
            <span
              className={`w-full rounded-t-sm ${
                index % 2 === 0 ? "bg-brand-900" : "bg-danger/70"
              }`}
              style={{ height: `${(height / 120) * 100}%` }}
            />
            <span className="text-center text-[10px] text-content-muted">
              {months[index]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-border-light pt-4">
        <p className="text-label font-semibold text-content">Top Categories</p>
        <ul className="mt-3 space-y-2.5">
          {[
            ["Food & Dining", "PKR 45,200", "bg-chart-1"],
            ["Transport", "PKR 32,800", "bg-chart-2"],
            ["Housing", "PKR 28,100", "bg-chart-3"],
          ].map(([label, amount, colour]) => (
            <li key={label} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className={`size-2.5 shrink-0 rounded-sm ${colour}`} />
                <span className="truncate text-label text-content-secondary">
                  {label}
                </span>
              </span>
              <span className="shrink-0 text-label font-semibold text-content">
                {amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The floating card on the dark "Clarity feels good." break. */
export function OverviewCardMockup() {
  const bars = [50, 35, 65, 45, 72, 55, 40, 60];

  return (
    <div
      aria-hidden
      className="w-full max-w-[520px] rounded-lg bg-surface p-5 shadow-[0_16px_48px_rgba(0,0,0,0.28)] sm:p-6"
    >
      <div className="flex items-center justify-between">
        <p className="text-h3 font-semibold text-content">Financial Overview</p>
        <p className="text-label text-content-muted">July 2026</p>
      </div>

      <div className="mt-5 rounded-md bg-gradient-to-r from-brand-900 to-brand-800 p-5">
        <p className="text-caption font-medium text-white/70">Total Balance</p>
        <p className="mt-1 text-stat font-bold text-content-inverse">
          PKR 245,500
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-caption">
          <span className="text-white/80">Income · PKR 185,000</span>
          <span className="text-white/80">Expenses · PKR 92,500</span>
        </div>
      </div>

      <div className="mt-5 flex h-20 items-end gap-2">
        {bars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-full rounded-t-sm bg-brand-900"
            style={{ height: `${height}%`, opacity: 0.45 + index * 0.05 }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-caption font-medium text-content-muted">
          Monthly Spending Trend
        </p>
        <p className="text-caption font-medium text-success">
          ↓ 12% vs last month
        </p>
      </div>
    </div>
  );
}
