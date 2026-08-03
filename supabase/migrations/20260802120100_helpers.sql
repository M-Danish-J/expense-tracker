-- Expensio — membership helper functions
--
-- These live in a non-exposed `private` schema and are SECURITY DEFINER so that
-- RLS policies on workspace_members can ask "is the caller a member?" without
-- recursing into workspace_members' own policy.
--
-- Safety: each function only ever answers a question about the *calling* user
-- (auth.uid() is checked inside the body, never passed in), so granting EXECUTE
-- to `authenticated` leaks nothing. `anon` and `public` are revoked.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Is the calling user a member of this workspace?
create or replace function private.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = ws_id
      and m.user_id = (select auth.uid())
  );
$$;

-- The calling user's role in this workspace, or null when not a member.
create or replace function private.workspace_role(ws_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.workspace_members m
  where m.workspace_id = ws_id
    and m.user_id = (select auth.uid())
  limit 1;
$$;

-- May the calling user create/modify financial data in this workspace?
-- `viewer` is deliberately excluded: read-only.
create or replace function private.can_write_workspace(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = ws_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'member')
  );
$$;

-- May the calling user administer this workspace (rename, manage members)?
create or replace function private.can_admin_workspace(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = ws_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin')
  );
$$;

-- Does the calling user own this workspace? Used to break the chicken-and-egg
-- when the very first membership row of a freshly created workspace is written.
create or replace function private.owns_workspace(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = ws_id
      and w.owner_id = (select auth.uid())
  );
$$;

-- Does the calling user share at least one workspace with this user?
create or replace function private.shares_workspace_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs
      on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = other_user_id
  );
$$;

revoke all on function
  private.is_workspace_member(uuid),
  private.workspace_role(uuid),
  private.can_write_workspace(uuid),
  private.can_admin_workspace(uuid),
  private.owns_workspace(uuid),
  private.shares_workspace_with(uuid)
from public, anon;

grant execute on function
  private.is_workspace_member(uuid),
  private.workspace_role(uuid),
  private.can_write_workspace(uuid),
  private.can_admin_workspace(uuid),
  private.owns_workspace(uuid),
  private.shares_workspace_with(uuid)
to authenticated;
