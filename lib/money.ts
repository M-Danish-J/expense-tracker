/**
 * Money handling.
 *
 * Postgres stores every amount as `numeric(19, 4)` and PostgREST returns it as a
 * *string*. That string must never touch `parseFloat` — 0.1 + 0.2 problems are
 * not acceptable in a ledger. Everything here converts to `bigint` minor units
 * at scale 4 (the same scale as the column), does exact integer arithmetic, and
 * only converts back to text for display.
 */

/** numeric(19, 4) — four digits after the decimal point. */
export const SCALE = 4;
const SCALE_FACTOR = 10n ** BigInt(SCALE);

/** An exact amount, held as minor units at SCALE (e.g. 1.25 -> 12500n). */
export type Money = bigint;

export const ZERO: Money = 0n;

/**
 * Parse a decimal string (as returned by PostgREST) into exact minor units.
 * Accepts an optional sign, thousands separators and up to SCALE decimals;
 * extra decimals are rejected rather than silently rounded.
 */
export function parseMoney(input: string | number | null | undefined): Money {
  if (input === null || input === undefined || input === "") return ZERO;

  const raw = String(input).trim().replace(/,/g, "");
  const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(raw);
  if (!match || (match[2] === "" && (match[3] ?? "") === "")) {
    throw new Error(`Not a valid amount: ${String(input)}`);
  }

  const [, sign, whole, fraction = ""] = match;
  if (fraction.length > SCALE) {
    throw new Error(`Amounts support at most ${SCALE} decimal places`);
  }

  const units = BigInt(whole || "0") * SCALE_FACTOR;
  const sub = BigInt(fraction.padEnd(SCALE, "0") || "0");
  const total = units + sub;
  return sign === "-" ? -total : total;
}

/** Parse without throwing — returns null when the input is not a valid amount. */
export function tryParseMoney(input: string | number | null | undefined): Money | null {
  try {
    return parseMoney(input);
  } catch {
    return null;
  }
}

/** Render minor units back to the plain decimal string the database expects. */
export function toNumericString(value: Money): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / SCALE_FACTOR;
  const fraction = (abs % SCALE_FACTOR).toString().padStart(SCALE, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/**
 * Hand a money value to PostgREST for a `numeric` column.
 *
 * We deliberately send the exact decimal *string*: Postgres casts it to numeric
 * losslessly, whereas a JS number would already have rounded. The generated
 * types model `numeric` as `number` (that is what PostgREST returns by default
 * on write-side types), so this is where that mismatch is resolved — once,
 * with an explanation, instead of scattered casts at each call site.
 */
export function numericColumn(value: Money): number {
  return toNumericString(value) as unknown as number;
}

export function addMoney(a: Money, b: Money): Money {
  return a + b;
}

export function subtractMoney(a: Money, b: Money): Money {
  return a - b;
}

export function sumMoney(values: readonly Money[]): Money {
  return values.reduce<Money>((total, v) => total + v, ZERO);
}

export function negateMoney(value: Money): Money {
  return -value;
}

export function isZero(value: Money): boolean {
  return value === ZERO;
}

export function isNegative(value: Money): boolean {
  return value < ZERO;
}

/**
 * Convert to a JS number for charting only. Charts render pixels, so the tiny
 * precision loss is irrelevant there — but never route a stored value or a
 * displayed total through this.
 */
export function toChartNumber(value: Money): number {
  return Number(value) / Number(SCALE_FACTOR);
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, decimals: number): Intl.NumberFormat {
  const key = `${currency}:${decimals}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

interface FormatOptions {
  /** Prefix positive values with "+". Used for income rows. */
  readonly signed?: boolean;
  /** Decimal places to display. Defaults to 2. */
  readonly decimals?: number;
}

/**
 * Format for display. The value is divided exactly (not via floating point)
 * before handing a fixed-precision string to Intl.
 */
export function formatMoney(
  value: Money,
  currency: string,
  options: FormatOptions = {},
): string {
  const { signed = false, decimals = 2 } = options;

  const negative = value < 0n;
  const abs = negative ? -value : value;

  // Round half-up from SCALE down to `decimals`, in integer arithmetic.
  const shift = 10n ** BigInt(SCALE - decimals);
  const rounded = (abs + shift / 2n) / shift;
  const whole = rounded / 10n ** BigInt(decimals);
  const fraction =
    decimals > 0
      ? `.${(rounded % 10n ** BigInt(decimals)).toString().padStart(decimals, "0")}`
      : "";

  const formatted = getFormatter(currency, decimals).format(
    Number(`${whole}${fraction}`),
  );

  if (negative) return `-${formatted}`;
  if (signed && value > 0n) return `+${formatted}`;
  return formatted;
}

/** Compact form for chart axes, e.g. 250000 -> "250K". */
export function formatCompact(value: Money, currency: string): string {
  const asNumber = toChartNumber(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(asNumber);
}

/** Percentages come back from Postgres as numeric strings too. */
export function formatPercent(value: string | number | null): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`;
}
