"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ACTIVE_WORKSPACE_COOKIE, getSessionContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, toUserMessage, type ActionResult } from "@/lib/errors";
import { profileSchema, workspaceSchema, firstIssue } from "@/lib/validation";

/**
 * Switch the active workspace.
 *
 * The submitted id is checked against this user's memberships before the cookie
 * is written, so a forged value simply doesn't take effect.
 */
export async function switchWorkspace(
  workspaceId: string,
): Promise<ActionResult> {
  const session = await getSessionContext();

  const allowed = session.memberships.some(
    (m) => m.workspace.id === workspaceId,
  );
  if (!allowed) {
    return fail("You don't have access to that workspace.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return ok();
}

export async function updateProfile(
  values: unknown,
): Promise<ActionResult> {
  const session = await getSessionContext();
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      timezone: parsed.data.timezone,
    })
    .eq("id", session.userId);

  if (error) return fail(toUserMessage(error));

  revalidatePath("/", "layout");
  return ok();
}

export async function renameWorkspace(values: unknown): Promise<ActionResult> {
  const session = await getSessionContext();
  const parsed = workspaceSchema.safeParse(values);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ name: parsed.data.name })
    .eq("id", session.workspace.id);

  if (error) return fail(toUserMessage(error));

  revalidatePath("/", "layout");
  return ok();
}
