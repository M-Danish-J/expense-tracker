"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/workspace";
import { canWrite } from "@/lib/db/types";
import { fail, ok, toUserMessage, type ActionResult } from "@/lib/errors";
import { accountSchema, firstIssue } from "@/lib/validation";
import { numericColumn, parseMoney } from "@/lib/money";

function revalidateAccounts() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function saveAccount(
  values: unknown,
  accountId?: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSessionContext();

  if (!canWrite(session.role)) {
    return fail("Your role in this workspace is read-only.");
  }

  const parsed = accountSchema.safeParse(values);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const payload = {
    workspace_id: session.workspace.id,
    name: parsed.data.name,
    type: parsed.data.type,
    // Accounts always carry the workspace currency; the DB trigger enforces it
    // too, so a mismatched value can't slip in from anywhere.
    currency: session.currency,
    initial_balance: numericColumn(
      parseMoney(parsed.data.initial_balance || "0"),
    ),
    is_active: parsed.data.is_active,
  };

  if (accountId) {
    const { data, error } = await supabase
      .from("accounts")
      .update({ ...payload, updated_by: session.userId })
      .eq("id", accountId)
      .eq("workspace_id", session.workspace.id)
      .select("id")
      .single();
    if (error || !data) return fail(toUserMessage(error));
    revalidateAccounts();
    return ok({ id: data.id });
  }

  const { data, error } = await supabase
    .from("accounts")
    .insert({ ...payload, created_by: session.userId })
    .select("id")
    .single();
  if (error || !data) return fail(toUserMessage(error));

  revalidateAccounts();
  return ok({ id: data.id });
}

/**
 * Accounts are deactivated, never deleted, once they carry history — the
 * `ON DELETE RESTRICT` foreign keys make that a database guarantee, and this is
 * the supported way to retire one.
 */
export async function setAccountActive(
  accountId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const session = await getSessionContext();

  if (!canWrite(session.role)) {
    return fail("Your role in this workspace is read-only.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: isActive, updated_by: session.userId })
    .eq("id", accountId)
    .eq("workspace_id", session.workspace.id);

  if (error) return fail(toUserMessage(error));

  revalidateAccounts();
  return ok();
}

/** Only ever succeeds for an account with no transactions or transfers. */
export async function deleteAccount(accountId: string): Promise<ActionResult> {
  const session = await getSessionContext();

  if (!canWrite(session.role)) {
    return fail("Your role in this workspace is read-only.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .eq("workspace_id", session.workspace.id);

  if (error) return fail(toUserMessage(error));

  revalidateAccounts();
  return ok();
}
