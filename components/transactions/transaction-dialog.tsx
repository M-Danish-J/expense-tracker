"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { today } from "@/lib/dates";
import { ledgerEntrySchema, type LedgerEntryValues } from "@/lib/validation";
import { saveLedgerEntry } from "@/app/actions/transactions";
import type { Account, CategoryTree, LedgerKind } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TransactionDraft {
  readonly id: string;
  readonly kind: LedgerKind;
  readonly amount: string;
  readonly entry_date: string;
  readonly description: string | null;
  readonly notes: string | null;
  readonly account_id: string | null;
  readonly to_account_id: string | null;
  readonly category_id: string | null;
}

interface TransactionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly accounts: readonly Account[];
  readonly categories: readonly CategoryTree[];
  readonly currency: string;
  /** Present when editing; absent when adding. */
  readonly draft?: TransactionDraft | null;
}

type FormValues = {
  kind: LedgerKind;
  amount: string;
  account_id: string;
  category_id: string;
  from_account_id: string;
  to_account_id: string;
  entry_date: string;
  description: string;
  notes: string;
};

/**
 * The Add/Edit Transaction modal from the Pencil design.
 *
 * The design shows only Expense and Income; Transfer is required by the spec,
 * so it is added as a third segment in the same visual language, swapping the
 * Category field for the From/To account pair.
 */
export function TransactionDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  currency,
  draft,
}: TransactionDialogProps) {
  const isEditing = Boolean(draft);
  const [kind, setKind] = useState<LedgerKind>(draft?.kind ?? "expense");

  const activeAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.is_active || account.id === draft?.account_id,
      ),
    [accounts, draft?.account_id],
  );

  const defaults = useMemo<FormValues>(
    () => ({
      kind: draft?.kind ?? "expense",
      amount: draft?.amount ?? "",
      account_id: draft?.kind === "transfer" ? "" : (draft?.account_id ?? ""),
      category_id: draft?.category_id ?? "",
      from_account_id: draft?.kind === "transfer" ? (draft.account_id ?? "") : "",
      to_account_id: draft?.to_account_id ?? "",
      entry_date: draft?.entry_date ?? today(),
      description: draft?.description ?? "",
      notes: draft?.notes ?? "",
    }),
    [draft],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: defaults });

  // Re-seed whenever the dialog opens, so editing one row then another doesn't
  // leave stale values behind.
  useEffect(() => {
    if (open) {
      reset(defaults);
      setKind(defaults.kind);
    }
  }, [open, defaults, reset]);

  const relevantCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === (kind === "income" ? "income" : "expense"),
      ),
    [categories, kind],
  );

  const changeKind = (next: LedgerKind) => {
    setKind(next);
    setValue("kind", next);
    // A category from the other type would fail validation server-side anyway.
    setValue("category_id", "");
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload: unknown =
      kind === "transfer"
        ? {
            kind: "transfer",
            amount: values.amount,
            from_account_id: values.from_account_id,
            to_account_id: values.to_account_id,
            transfer_date: values.entry_date,
            description: values.description,
            notes: values.notes,
          }
        : {
            kind,
            amount: values.amount,
            account_id: values.account_id,
            category_id: values.category_id,
            transaction_date: values.entry_date,
            description: values.description,
            notes: values.notes,
          };

    // Validate with the same schema the server uses, so the user sees field
    // errors before a round trip rather than a generic failure after one.
    const parsed = ledgerEntrySchema.safeParse(payload);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = mapIssuePathToField(String(issue.path[0] ?? ""));
        if (field) setError(field, { message: issue.message });
      }
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    const result = await saveLedgerEntry(
      parsed.data satisfies LedgerEntryValues,
      draft?.id,
    );

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      isEditing
        ? "Transaction updated"
        : `${labelFor(kind)} added`,
    );
    onOpenChange(false);
  });

  const amountLabel = kind === "transfer" ? "Amount to transfer" : "Amount";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this entry."
              : "Record an expense, income or a transfer between your accounts."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="contents">
          <DialogBody className="space-y-lg">
            {/* Editing can't change an expense into a transfer: they live in
                different tables, so the type picker is add-only. */}
            {!isEditing ? (
              <div className="space-y-1.5">
                <Label htmlFor="kind">Transaction type</Label>
                <Tabs
                  value={kind}
                  onValueChange={(value) => changeKind(value as LedgerKind)}
                >
                  <TabsList id="kind">
                    <TabsTrigger value="expense" tone="expense">
                      <ArrowDownRight />
                      Expense
                    </TabsTrigger>
                    <TabsTrigger value="income" tone="income">
                      <ArrowUpRight />
                      Income
                    </TabsTrigger>
                    <TabsTrigger value="transfer" tone="transfer">
                      <ArrowLeftRight />
                      Transfer
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            ) : null}

            <Field
              label={amountLabel}
              htmlFor="amount"
              error={errors.amount?.message}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-body text-content-muted">
                  {currency}
                </span>
                <Input
                  id="amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  className="pl-14 text-h3 font-semibold tabular"
                  aria-invalid={Boolean(errors.amount)}
                  {...register("amount")}
                />
              </div>
            </Field>

            {kind === "transfer" ? (
              <div className="grid gap-lg sm:grid-cols-2">
                <Field label="From account" htmlFor="from_account_id">
                  <AccountSelect
                    name="from_account_id"
                    control={control}
                    accounts={activeAccounts}
                    placeholder="Select source"
                  />
                </Field>
                <Field label="To account" htmlFor="to_account_id">
                  <AccountSelect
                    name="to_account_id"
                    control={control}
                    accounts={activeAccounts}
                    placeholder="Select destination"
                  />
                </Field>
              </div>
            ) : (
              <div className="grid gap-lg sm:grid-cols-2">
                <Field label="Category" htmlFor="category_id">
                  <Controller
                    control={control}
                    name="category_id"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="category_id">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {relevantCategories.map((parent) => (
                            <SelectGroup key={parent.id}>
                              <SelectLabel>{parent.name}</SelectLabel>
                              {parent.is_active ? (
                                <SelectItem value={parent.id}>
                                  {parent.name}
                                </SelectItem>
                              ) : null}
                              {parent.children
                                .filter((child) => child.is_active)
                                .map((child) => (
                                  <SelectItem key={child.id} value={child.id}>
                                    {child.name}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Account" htmlFor="account_id">
                  <AccountSelect
                    name="account_id"
                    control={control}
                    accounts={activeAccounts}
                    placeholder="Select account"
                  />
                </Field>
              </div>
            )}

            <Field
              label="Date"
              htmlFor="entry_date"
              error={errors.entry_date?.message}
            >
              <Input
                id="entry_date"
                type="date"
                aria-invalid={Boolean(errors.entry_date)}
                {...register("entry_date")}
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <Input
                id="description"
                autoComplete="off"
                placeholder={
                  kind === "transfer"
                    ? "e.g. ATM withdrawal"
                    : "e.g. Groceries at Imtiaz"
                }
                {...register("description")}
              />
            </Field>

            <Field label="Notes (optional)" htmlFor="notes">
              <Textarea
                id="notes"
                rows={2}
                placeholder="Add any additional notes…"
                {...register("notes")}
              />
            </Field>
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
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Save transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The schema names the date field per variant (`transaction_date` /
 * `transfer_date`) while the form uses one `entry_date` input; this maps issues
 * back onto the field the user can actually see.
 */
function mapIssuePathToField(path: string): keyof FormValues | null {
  if (path === "transaction_date" || path === "transfer_date") {
    return "entry_date";
  }
  const known: readonly (keyof FormValues)[] = [
    "amount",
    "account_id",
    "category_id",
    "from_account_id",
    "to_account_id",
    "description",
    "notes",
  ];
  return known.find((field) => field === path) ?? null;
}

function labelFor(kind: LedgerKind): string {
  if (kind === "income") return "Income";
  if (kind === "transfer") return "Transfer";
  return "Expense";
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  readonly label: string;
  readonly htmlFor: string;
  readonly error?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className={cn("text-caption text-danger")} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AccountSelect({
  name,
  control,
  accounts,
  placeholder,
}: {
  readonly name: "account_id" | "from_account_id" | "to_account_id";
  readonly control: ReturnType<typeof useForm<FormValues>>["control"];
  readonly accounts: readonly Account[];
  readonly placeholder: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger id={name}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
