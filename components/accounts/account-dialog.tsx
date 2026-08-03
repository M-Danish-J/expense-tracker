"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { saveAccount } from "@/app/actions/accounts";
import { accountSchema } from "@/lib/validation";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AccountDraft {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly initial_balance: string;
  readonly is_active: boolean;
}

interface FormValues {
  name: string;
  type: AccountType;
  initial_balance: string;
}

export function AccountDialog({
  open,
  onOpenChange,
  currency,
  draft,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly currency: string;
  readonly draft?: AccountDraft | null;
}) {
  const isEditing = Boolean(draft);

  const defaults = useMemo<FormValues>(
    () => ({
      name: draft?.name ?? "",
      type: (draft?.type as AccountType) ?? "bank",
      initial_balance: draft?.initial_balance ?? "0",
    }),
    [draft],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: defaults });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const type = watch("type");

  const onSubmit = handleSubmit(async (values) => {
    const parsed = accountSchema.safeParse({
      ...values,
      is_active: draft?.is_active ?? true,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (field === "name" || field === "type" || field === "initial_balance") {
          setError(field, { message: issue.message });
        }
      }
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    const result = await saveAccount(parsed.data, draft?.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Account updated" : "Account created");
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit account" : "New account"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update how this account appears across the app."
              : "Add a cash, bank or wallet account to track."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="contents">
          <DialogBody className="space-y-lg">
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Account name</Label>
              <Input
                id="account-name"
                autoComplete="off"
                placeholder="e.g. Meezan Bank"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-caption text-danger" role="alert">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) =>
                  setValue("type", value as AccountType, { shouldDirty: true })
                }
              >
                <SelectTrigger id="account-type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((accountType) => (
                    <SelectItem key={accountType} value={accountType}>
                      {ACCOUNT_TYPE_LABELS[accountType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="initial-balance">Opening balance</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-body text-content-muted">
                  {currency}
                </span>
                <Input
                  id="initial-balance"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  className="pl-14 tabular"
                  aria-invalid={Boolean(errors.initial_balance)}
                  {...register("initial_balance")}
                />
              </div>
              <p className="text-caption text-content-secondary">
                The balance before you started tracking. Everything after is
                calculated from your transactions.
              </p>
              {errors.initial_balance ? (
                <p className="text-caption text-danger" role="alert">
                  {errors.initial_balance.message}
                </p>
              ) : null}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Trigger + dialog pair, so pages only need to drop in one component. */
export function NewAccountButton({
  currency,
  label = "New account",
  variant = "primary",
}: {
  readonly currency: string;
  readonly label?: string;
  readonly variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <AccountDialog open={open} onOpenChange={setOpen} currency={currency} />
    </>
  );
}
