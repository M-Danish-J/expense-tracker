"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TransactionDialog,
  type TransactionDraft,
} from "@/components/transactions/transaction-dialog";
import type { Account, CategoryTree } from "@/lib/db/types";

/**
 * The primary action, reachable from the header, the dashboard and every empty
 * state. All of them render this one component so the flow is identical
 * wherever it starts.
 */
export function AddTransactionButton({
  accounts,
  categories,
  currency,
  label = "Add Transaction",
  variant = "primary",
  size,
  compact = false,
  draft,
}: {
  readonly accounts: readonly Account[];
  readonly categories: readonly CategoryTree[];
  readonly currency: string;
  readonly label?: string;
  readonly variant?: "primary" | "secondary" | "ghost";
  readonly size?: "default" | "sm" | "lg";
  /** Collapse to an icon-only button on small screens. */
  readonly compact?: boolean;
  readonly draft?: TransactionDraft | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        aria-label={compact ? label : undefined}
        className={compact ? "px-3 sm:px-5" : undefined}
      >
        <Plus aria-hidden />
        <span className={compact ? "hidden sm:inline" : undefined}>{label}</span>
      </Button>
      <TransactionDialog
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
        currency={currency}
        draft={draft}
      />
    </>
  );
}
