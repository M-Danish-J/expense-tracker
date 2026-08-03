import { ArrowDownRight, ArrowLeftRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { LedgerKind } from "@/lib/db/types";

/** Pencil spec — Badge/Income and Badge/Expense, plus a transfer variant. */
export function KindBadge({ kind }: { readonly kind: LedgerKind }) {
  if (kind === "income") {
    return (
      <Badge variant="income">
        <ArrowUpRight aria-hidden />
        Income
      </Badge>
    );
  }
  if (kind === "transfer") {
    return (
      <Badge variant="transfer">
        <ArrowLeftRight aria-hidden />
        Transfer
      </Badge>
    );
  }
  return (
    <Badge variant="expense">
      <ArrowDownRight aria-hidden />
      Expense
    </Badge>
  );
}
