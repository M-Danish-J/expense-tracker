"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/workspace";
import { canWrite } from "@/lib/db/types";
import { fail, ok, toUserMessage, type ActionResult } from "@/lib/errors";
import { categorySchema, firstIssue } from "@/lib/validation";

function revalidateCategories() {
  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function saveCategory(
  values: unknown,
  categoryId?: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSessionContext();

  if (!canWrite(session.role)) {
    return fail("Your role in this workspace is read-only.");
  }

  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();

  // A parent must be in this workspace; the trigger additionally enforces the
  // matching type and the two-level depth limit.
  if (parsed.data.parent_id) {
    if (parsed.data.parent_id === categoryId) {
      return fail("A category can't be its own parent.");
    }
    const { data: parent } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.data.parent_id)
      .eq("workspace_id", session.workspace.id)
      .maybeSingle();
    if (!parent) return fail("Choose a parent from this workspace.");
  }

  const payload = {
    workspace_id: session.workspace.id,
    name: parsed.data.name,
    type: parsed.data.type,
    parent_id: parsed.data.parent_id ?? null,
    is_active: parsed.data.is_active,
  };

  if (categoryId) {
    const { data, error } = await supabase
      .from("categories")
      .update({ ...payload, updated_by: session.userId })
      .eq("id", categoryId)
      .eq("workspace_id", session.workspace.id)
      .select("id")
      .single();
    if (error || !data) return fail(toUserMessage(error));
    revalidateCategories();
    return ok({ id: data.id });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...payload, created_by: session.userId })
    .select("id")
    .single();
  if (error || !data) return fail(toUserMessage(error));

  revalidateCategories();
  return ok({ id: data.id });
}

/**
 * Deactivating hides a category from the pickers while leaving every past
 * transaction intact and still labelled.
 */
export async function setCategoryActive(
  categoryId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const session = await getSessionContext();

  if (!canWrite(session.role)) {
    return fail("Your role in this workspace is read-only.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive, updated_by: session.userId })
    .eq("id", categoryId)
    .eq("workspace_id", session.workspace.id);

  if (error) return fail(toUserMessage(error));

  revalidateCategories();
  return ok();
}

/** Only succeeds for a category with no transactions and no children. */
export async function deleteCategory(
  categoryId: string,
): Promise<ActionResult> {
  const session = await getSessionContext();

  if (!canWrite(session.role)) {
    return fail("Your role in this workspace is read-only.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("workspace_id", session.workspace.id);

  if (error) return fail(toUserMessage(error));

  revalidateCategories();
  return ok();
}
