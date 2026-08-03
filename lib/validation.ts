import { z } from "zod";

import { isValidIsoDate } from "@/lib/dates";
import { tryParseMoney } from "@/lib/money";
import { ACCOUNT_TYPES, CATEGORY_TYPES } from "@/lib/db/types";

/**
 * One set of schemas, imported by both the React Hook Form resolver and the
 * Server Action. Client-side validation is a convenience; the action re-parses
 * the same schema so a hand-crafted request gets the identical treatment.
 */

const uuid = z.string().uuid("Please choose a valid option");

/**
 * Amounts stay as strings all the way to Postgres `numeric`. Validating with a
 * bigint parser (rather than `z.number()`) keeps them exact and rejects the
 * inputs a float would silently mangle.
 */
const amount = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .superRefine((value, ctx) => {
    const parsed = tryParseMoney(value);
    if (parsed === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid amount, e.g. 1250.00",
      });
      return;
    }
    if (parsed <= 0n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be greater than zero",
      });
    }
  });

const isoDate = z
  .string()
  .trim()
  .min(1, "Choose a date")
  .refine(isValidIsoDate, "Choose a valid date");

const description = z
  .string()
  .trim()
  .max(255, "Keep the description under 255 characters");

const notes = z.string().trim().max(2000, "Notes are too long");

/** Turns "" into undefined so optional selects don't submit empty strings. */
const optionalUuid = z
  .union([uuid, z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the account a name")
    .max(150, "Name is too long"),
  type: z.enum(ACCOUNT_TYPES, {
    errorMap: () => ({ message: "Choose an account type" }),
  }),
  initial_balance: z
    .string()
    .trim()
    .default("0")
    .superRefine((value, ctx) => {
      if (tryParseMoney(value || "0") === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid opening balance",
        });
      }
    }),
  is_active: z.boolean().default(true),
});

export type AccountInput = z.input<typeof accountSchema>;
export type AccountValues = z.output<typeof accountSchema>;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the category a name")
    .max(100, "Name is too long"),
  type: z.enum(CATEGORY_TYPES, {
    errorMap: () => ({ message: "Choose expense or income" }),
  }),
  parent_id: optionalUuid,
  is_active: z.boolean().default(true),
});

export type CategoryInput = z.input<typeof categorySchema>;
export type CategoryValues = z.output<typeof categorySchema>;

// ---------------------------------------------------------------------------
// Transactions and transfers
// ---------------------------------------------------------------------------

export const expenseIncomeSchema = z.object({
  kind: z.enum(["expense", "income"]),
  amount,
  account_id: uuid,
  category_id: optionalUuid,
  transaction_date: isoDate,
  description: description.optional(),
  notes: notes.optional(),
});

export const transferSchema = z
  .object({
    kind: z.literal("transfer"),
    amount,
    from_account_id: uuid,
    to_account_id: uuid,
    transfer_date: isoDate,
    description: description.optional(),
    notes: notes.optional(),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: "Choose two different accounts",
    path: ["to_account_id"],
  });

/** The union the Add/Edit Transaction dialog submits. */
export const ledgerEntrySchema = z.discriminatedUnion("kind", [
  expenseIncomeSchema.extend({ kind: z.literal("expense") }),
  expenseIncomeSchema.extend({ kind: z.literal("income") }),
  z.object({
    kind: z.literal("transfer"),
    amount,
    from_account_id: uuid,
    to_account_id: uuid,
    transfer_date: isoDate,
    description: description.optional(),
    notes: notes.optional(),
  }),
]);

export type ExpenseIncomeValues = z.output<typeof expenseIncomeSchema>;
export type TransferValues = z.output<typeof transferSchema>;
export type LedgerEntryValues = z.output<typeof ledgerEntrySchema>;

// ---------------------------------------------------------------------------
// Profile / settings
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(150, "Name is too long")
    .optional()
    .transform((v) => v || null),
  timezone: z.string().trim().min(1, "Choose a timezone").max(100),
});

export type ProfileValues = z.output<typeof profileSchema>;

export const workspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the workspace a name")
    .max(150, "Name is too long"),
});

export type WorkspaceValues = z.output<typeof workspaceSchema>;

/** Collapses a Zod error into the first readable message for a toast. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}
