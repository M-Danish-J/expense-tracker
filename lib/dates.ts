/**
 * Date helpers.
 *
 * Transaction dates are stored as Postgres `date` (no time, no zone), so they
 * are handled as plain `YYYY-MM-DD` strings throughout. Parsing them with `new
 * Date("2026-08-02")` would shift the day for anyone west of UTC, so display
 * formatting builds the date in local time explicitly.
 */

export type IsoDate = string;

export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today(): IsoDate {
  return toIsoDate(new Date());
}

/** Build a local Date from a `YYYY-MM-DD` string without timezone drift. */
export function fromIsoDate(value: IsoDate): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = fromIsoDate(value);
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value;
}

/** "Jul 28, 2026" — the format used in the Pencil tables. */
export function formatDate(value: IsoDate): string {
  return fromIsoDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Jul 28" — for dense contexts like the dashboard's recent list. */
export function formatDateShort(value: IsoDate): string {
  return fromIsoDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export type PeriodKey =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "all_time";

export const PERIOD_OPTIONS: ReadonlyArray<{
  value: PeriodKey;
  label: string;
}> = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
];

export interface DateRange {
  readonly from: IsoDate;
  readonly to: IsoDate;
  /** Buckets the income-vs-expenses chart by day for short ranges. */
  readonly granularity: "day" | "month";
  readonly label: string;
}

export function isPeriodKey(value: string | undefined): value is PeriodKey {
  return PERIOD_OPTIONS.some((option) => option.value === value);
}

/** Resolve a period selector value into a concrete, inclusive date range. */
export function resolvePeriod(period: PeriodKey, now = new Date()): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();
  const label =
    PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "This month";

  const startOfMonth = (y: number, m: number) => new Date(y, m, 1);
  const endOfMonth = (y: number, m: number) => new Date(y, m + 1, 0);

  switch (period) {
    case "last_month":
      return {
        from: toIsoDate(startOfMonth(year, month - 1)),
        to: toIsoDate(endOfMonth(year, month - 1)),
        granularity: "day",
        label,
      };
    case "last_3_months":
      return {
        from: toIsoDate(startOfMonth(year, month - 2)),
        to: toIsoDate(endOfMonth(year, month)),
        granularity: "month",
        label,
      };
    case "last_6_months":
      return {
        from: toIsoDate(startOfMonth(year, month - 5)),
        to: toIsoDate(endOfMonth(year, month)),
        granularity: "month",
        label,
      };
    case "this_year":
      return {
        from: toIsoDate(new Date(year, 0, 1)),
        to: toIsoDate(new Date(year, 11, 31)),
        granularity: "month",
        label,
      };
    case "all_time":
      return {
        from: "1970-01-01",
        to: toIsoDate(new Date(year + 1, 11, 31)),
        granularity: "month",
        label,
      };
    case "this_month":
    default:
      return {
        from: toIsoDate(startOfMonth(year, month)),
        to: toIsoDate(endOfMonth(year, month)),
        granularity: "day",
        label,
      };
  }
}

/** Chart axis labels, matching the range's granularity. */
export function formatBucket(
  value: IsoDate,
  granularity: "day" | "month",
): string {
  const date = fromIsoDate(value);
  return granularity === "day"
    ? date.toLocaleDateString("en-US", { day: "numeric", month: "short" })
    : date.toLocaleDateString("en-US", { month: "short" });
}

/** "Good morning" / "Good afternoon" / "Good evening" in the user's timezone. */
export function greetingFor(timezone: string, now = new Date()): string {
  let hour: number;
  try {
    hour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
      }).format(now),
    );
  } catch {
    hour = now.getHours();
  }

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
