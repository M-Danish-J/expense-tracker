"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBucket } from "@/lib/dates";
import { formatCompact, formatMoney, parseMoney, toChartNumber } from "@/lib/money";
import type { SeriesPoint } from "@/lib/db/types";

interface ChartRow {
  label: string;
  income: number;
  expenses: number;
  incomeRaw: string;
  expensesRaw: string;
}

/**
 * Pencil spec — grouped bars, navy for income and red for expenses.
 *
 * The bar heights use JS numbers because that is what pixels are; every value
 * the user actually reads is formatted from the exact decimal string instead.
 */
export function IncomeExpenseChart({
  data,
  currency,
  granularity,
}: {
  readonly data: readonly SeriesPoint[];
  readonly currency: string;
  readonly granularity: "day" | "month";
}) {
  const rows: ChartRow[] = data.map((point) => ({
    label: formatBucket(point.bucket, granularity),
    income: toChartNumber(parseMoney(point.income)),
    expenses: toChartNumber(parseMoney(point.expenses)),
    incomeRaw: point.income,
    expensesRaw: point.expenses,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          barGap={4}
        >
          <CartesianGrid
            vertical={false}
            stroke="hsl(var(--border-light))"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--text-muted))" }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fontSize: 12, fill: "hsl(var(--text-muted))" }}
            tickFormatter={(value: number) =>
              formatCompact(BigInt(Math.round(value * 10_000)), currency)
            }
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--surface-secondary))" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as ChartRow;
              return (
                <div className="rounded-md border border-border bg-surface p-3 shadow-raised">
                  <p className="text-caption font-medium text-content">{label}</p>
                  <dl className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between gap-6">
                      <dt className="flex items-center gap-1.5 text-caption text-content-secondary">
                        <span className="size-2 rounded-sm bg-brand-900" />
                        Income
                      </dt>
                      <dd className="tabular text-caption font-semibold text-content">
                        {formatMoney(parseMoney(row.incomeRaw), currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <dt className="flex items-center gap-1.5 text-caption text-content-secondary">
                        <span className="size-2 rounded-sm bg-danger" />
                        Expenses
                      </dt>
                      <dd className="tabular text-caption font-semibold text-content">
                        {formatMoney(parseMoney(row.expensesRaw), currency)}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            }}
          />
          <Bar
            dataKey="income"
            name="Income"
            fill="hsl(var(--primary-900))"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="hsl(var(--danger))"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
