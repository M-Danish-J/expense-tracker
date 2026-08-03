"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { deleteLedgerEntry } from "@/app/actions/transactions";
import { toast } from "@/components/ui/toaster";
import {
  TransactionDialog,
  type TransactionDraft,
} from "@/components/transactions/transaction-dialog";
import type { Account, CategoryTree } from "@/lib/db/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TransactionRowActions({
  draft,
  accounts,
  categories,
  currency,
}: {
  readonly draft: TransactionDraft;
  readonly accounts: readonly Account[];
  readonly categories: readonly CategoryTree[];
  readonly currency: string;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteLedgerEntry(draft.id, draft.kind);
      if (result.ok) {
        toast.success(
          draft.kind === "transfer" ? "Transfer deleted" : "Transaction deleted",
        );
        setConfirming(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          aria-label="Transaction actions"
          className="flex size-8 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={() => setEditing(true)}
            className="cursor-pointer"
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setConfirming(true)}
            className="cursor-pointer text-danger focus:text-danger"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TransactionDialog
        open={editing}
        onOpenChange={setEditing}
        accounts={accounts}
        categories={categories}
        currency={currency}
        draft={draft}
      />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {draft.kind === "transfer" ? "transfer" : "transaction"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {draft.kind === "transfer"
                ? "Both sides of the transfer will be reversed and the account balances updated. This can't be undone."
                : "The affected account balance will be updated. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
