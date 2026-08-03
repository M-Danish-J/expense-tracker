"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";

import { deleteAccount, setAccountActive } from "@/app/actions/accounts";
import { toast } from "@/components/ui/toaster";
import {
  AccountDialog,
  type AccountDraft,
} from "@/components/accounts/account-dialog";
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

/**
 * Accounts with financial history can't be deleted — the database refuses it.
 * The menu leads with deactivate for exactly that reason, and delete is only
 * offered when the account has never been used.
 */
export function AccountRowActions({
  account,
  currency,
  hasHistory,
}: {
  readonly account: AccountDraft;
  readonly currency: string;
  readonly hasHistory: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleActive = () => {
    startTransition(async () => {
      const result = await setAccountActive(account.id, !account.is_active);
      if (result.ok) {
        toast.success(
          account.is_active ? "Account deactivated" : "Account reactivated",
        );
      } else {
        toast.error(result.error);
      }
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteAccount(account.id);
      if (result.ok) {
        toast.success("Account deleted");
        setConfirmingDelete(false);
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
          aria-label={`Actions for ${account.name}`}
          className="flex size-8 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={() => setEditing(true)}
            className="cursor-pointer"
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleActive} className="cursor-pointer">
            {account.is_active ? (
              <>
                <PowerOff className="size-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="size-4" />
                Reactivate
              </>
            )}
          </DropdownMenuItem>
          {hasHistory ? null : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setConfirmingDelete(true)}
                className="cursor-pointer text-danger focus:text-danger"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDialog
        open={editing}
        onOpenChange={setEditing}
        currency={currency}
        draft={account}
      />

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {account.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This account has no transactions, so it can be removed permanently.
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
