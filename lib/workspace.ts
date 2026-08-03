import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile, Workspace, WorkspaceRole } from "@/lib/db/types";

export const ACTIVE_WORKSPACE_COOKIE = "expensio_workspace";

export interface WorkspaceMembership {
  readonly workspace: Workspace;
  readonly role: WorkspaceRole;
}

export interface SessionContext {
  readonly userId: string;
  readonly email: string;
  readonly profile: Profile;
  readonly workspace: Workspace;
  readonly role: WorkspaceRole;
  readonly memberships: readonly WorkspaceMembership[];
  /** The currency every amount in this workspace is denominated in. */
  readonly currency: string;
}

/**
 * Resolves who is asking and which workspace they are operating in.
 *
 * The active workspace arrives as a cookie, which is client-controlled and
 * therefore never trusted: it is only honoured when it matches a membership row
 * this user can actually see, and otherwise falls back to their first
 * workspace. RLS is the real enforcement — this is the server-side check that
 * sits in front of it, so no workspace id is ever taken on faith.
 */
export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims?.sub) {
    redirect("/auth/login");
  }
  const userId = claims.sub;

  const [{ data: profile }, { data: memberRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("workspace_members")
      .select("role, workspace:workspaces(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  const memberships: WorkspaceMembership[] = (memberRows ?? [])
    .flatMap((row) => (row.workspace ? [{ row, workspace: row.workspace }] : []))
    .filter(({ workspace }) => !workspace.is_archived)
    .map(({ row, workspace }) => ({
      workspace,
      role: row.role as WorkspaceRole,
    }));

  if (!profile || memberships.length === 0) {
    // The onboarding trigger creates both at sign-up, so we only land here if
    // every workspace was archived or removed out from under the user.
    redirect("/auth/error?error=no-workspace");
  }

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active =
    memberships.find((m) => m.workspace.id === requested) ?? memberships[0];

  return {
    userId,
    email: typeof claims.email === "string" ? claims.email : "",
    profile,
    workspace: active.workspace,
    role: active.role,
    memberships,
    currency: active.workspace.default_currency,
  };
}
