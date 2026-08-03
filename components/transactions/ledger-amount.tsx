import { cn } from "@/lib/utils";
import { formatMoney, parseMoney } from "@/lib/money";
import type { LedgerKind } from "@/lib/db/types";

/**
 * How an amount reads depends on what kind of entry it is: income gains a green
 * "+", expenses a red "−", and a transfer stays neutral because it changed no
 * one's net worth.
 */
export function LedgerAmount({
  amount,
  kind,
  currency,
  className,
}: {
  readonly amount: string;
  readonly kind: LedgerKind;
  readonly currency: string;
  readonly className?: string;
}) {
  const value = parseMoney(amount);

  if (kind === "transfer") {
    return (
      <span className={cn("tabular font-semibold text-content", className)}>
        {formatMoney(value, currency)}
      </span>
    );
  }

  const isIncome = kind === "income";
  const signed = isIncome ? value : -value;

  return (
    <span
      className={cn(
        "tabular font-semibold",
        isIncome ? "text-success" : "text-danger",
        className,
      )}
    >
      {formatMoney(signed, currency, { signed: true })}
    </span>
  );
}
