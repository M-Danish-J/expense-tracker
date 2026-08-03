"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/workspace";
import { canWrite } from "@/lib/db/types";
import { fail, ok, toUserMessage, type ActionResult } from "@/lib/errors";
import { firstIssue, ledgerEntrySchema } from "@/lib/validation";
import { numericColumn, parseMoney } from "@/lib/money";

/**
 * Creating, editing and deleting ledger entries.
 *
 * Transfers are written as a single row in `transfers`; the database trigger
 * derives the two `transfer_entries` in the same statement, so a transfer can
 * never end up half-recorded. There is deliberately no code here that writes
 * entries directly — the client has no privilege to do so.
 */

function revalidateFinancialViews() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
}

/** Re-checks that a referenced row really belongs to the active workspace. */
async function assertBelongsToWorkspace(
  table: "accounts" | "categories",
  ids: readonly string[],
  workspaceId: string,
): Promise<boolean> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return true;

  const supabase = await createClient();
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("workspace_id", workspaceId)
    .in("id", unique);

  return (data?.length ?? 0) === unique.length;
}

export async function saveLedgerEntry(
  values: unknown,
  entryId?: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSessionContext();

  if (!canWrite(session.role)) {
    return fail("Your role in this workspace is read-only.");
  }

  const parsed = ledgerEntrySchema.safeParse(values);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const input = parsed.data;
  const supabase = await createClient();
  const workspaceId = session.workspace.id;
  const amount = numericColumn(parseMoney(input.amount));

  if (input.kind === "transfer") {
    const accountsOk = await assertBelongsToWorkspace(
      "accounts",
      [input.from_account_id, input.to_account_id],
      workspaceId,
    );
    if (!accountsOk) {
      return fail("Choose accounts from this workspace.");
    }

    const payload = {
      workspace_id: workspaceId,
      from_account_id: input.from_account_id,
      to_account_id: input.to_account_id,
      amount,
      currency: session.currency,
      description: input.description || null,
      notes: input.notes || null,
      transfer_date: input.transfer_date,
    };

    if (entryId) {
      const { data, error } = await supabase
        .from("transfers")
        .update({ ...payload, updated_by: session.userId })
        .eq("id", entryId)
        .eq("workspace_id", workspaceId)
        .select("id")
        .single();
      if (error || !data) return fail(toUserMessage(error));
      revalidateFinancialViews();
      return ok({ id: data.id });
    }

    const { data, error } = await supabase
      .from("transfers")
      .insert({ ...payload, created_by: session.userId })
      .select("id")
      .single();
    if (error || !data) return fail(toUserMessage(error));
    revalidateFinancialViews();
    return ok({ id: data.id });
  }

  const referenced = [input.account_id];
  const accountsOk = await assertBelongsToWorkspace(
    "accounts",
    referenced,
    workspaceId,
  );
  if (!accountsOk) return fail("Choose an account from this workspace.");

  if (input.category_id) {
    const categoryOk = await assertBelongsToWorkspace(
      "categories",
      [input.category_id],
      workspaceId,
    );
    if (!categoryOk) return fail("Choose a category from this workspace.");
  }

  const payload = {
    workspace_id: workspaceId,
    account_id: input.account_id,
    category_id: input.category_id ?? null,
    type: input.kind,
    amount,
    currency: session.currency,
    description: input.description || null,
    notes: input.notes || null,
    transaction_date: input.transaction_date,
  };

  if (entryId) {
    const { data, error } = await supabase
      .from("transactions")
      .update({ ...payload, updated_by: session.userId })
      .eq("id", entryId)
      .eq("workspace_id", workspaceId)
      .select("id")
      .single();
    if (error || !data) return fail(toUserMessage(error));
    revalidateFinancialViews();
    return ok({ id: data.id });
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...payload, created_by: session.userId })
    .select("id")
    .single();
  if (error || !data) return fail(toUserMessage(error));
  revalidateFinancialViews();
  return ok({ id: data.id });
}

export async function deleteLedgerEntry(
  id: string,
  kind: "expense" | "income" | "transfer",
): Promise<ActionResult> {
  const session = await getSessionContext();

  if (!canWrite(session.role)) {
    return fail("Your role in this workspace is read-only.");
  }

  const supabase = await createClient();
  const table = kind === "transfer" ? "transfers" : "transactions";

  // Deleting the transfer cascades its entries, so the two can't diverge.
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("workspace_id", session.workspace.id);

  if (error) return fail(toUserMessage(error));

  revalidateFinancialViews();
  return ok();
}
