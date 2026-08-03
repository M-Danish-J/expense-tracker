"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  formatMoney,
  parseMoney,
  sumMoney,
  toChartNumber,
  toNumericString,
} from "@/lib/money";
import type { CategorySpend } from "@/lib/db/types";

/** The donut palette from the Pencil dashboard, in order. */
const SLICE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

const MAX_SLICES = 5;

/**
 * Pencil spec — donut with a percentage legend beside it. Beyond the top five
 * categories everything is folded into "Other" so the chart stays readable.
 */
export function CategoryDonut({
  data,
  currency,
}: {
  readonly data: readonly CategorySpend[];
  readonly currency: string;
}) {
  const top = data.slice(0, MAX_SLICES);
  const rest = data.slice(MAX_SLICES);

  const slices = [...top];
  if (rest.length > 0) {
    const restTotal = sumMoney(rest.map((row) => parseMoney(row.total)));
    const restPercent = rest.reduce(
      (total, row) => total + Number(row.percentage ?? 0),
      0,
    );
    slices.push({
      category_id: "__other__",
      category_name: `Other (${rest.length})`,
      total: toNumericString(restTotal),
      percentage: Math.round(restPercent * 10) / 10,
    });
  }

  const chartData = slices.map((slice) => ({
    name: slice.category_name,
    value: toChartNumber(parseMoney(slice.total)),
    raw: slice.total,
  }));

  return (
    <div className="flex flex-col items-center gap-lg sm:flex-row">
      <div className="h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as { name: string; raw: string };
                return (
                  <div className="rounded-md border border-border bg-surface p-3 shadow-raised">
                    <p className="text-caption font-medium text-content">
                      {row.name}
                    </p>
                    <p className="tabular mt-0.5 text-caption text-content-secondary">
                      {formatMoney(parseMoney(row.raw), currency)}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {slices.map((slice, index) => (
          <li
            key={slice.category_id ?? slice.category_name}
            className="flex items-center gap-2.5"
          >
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ background: SLICE_COLORS[index % SLICE_COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-body text-content-secondary">
              {slice.category_name}
            </span>
            <span className="tabular shrink-0 text-body font-medium text-content">
              {Number(slice.percentage ?? 0).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
