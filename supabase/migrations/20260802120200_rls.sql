-- Expensio — Row Level Security
--
-- The single rule: a row is reachable only if the caller is a member of the
-- workspace that owns it. Writes additionally require a non-viewer role.
-- `anon` has no privileges on any table — this application has no public data.

alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.accounts          enable row level security;
alter table public.categories        enable row level security;
alter table public.transactions      enable row level security;
alter table public.transfers         enable row level security;
alter table public.transfer_entries  enable row level security;

-- ---------------------------------------------------------------------------
-- Table privileges (defence in depth beneath the policies)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;

grant select, insert, update, delete on
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.accounts,
  public.categories,
  public.transactions,
  public.transfers
to authenticated;

-- transfer_entries are derived data: readable, never writable by any client.
grant select on public.transfer_entries to authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles are readable by self and workspace co-members"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.shares_workspace_with(id))
  );

create policy "users insert their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------

create policy "members read their workspaces"
  on public.workspaces for select to authenticated
  using ((select private.is_workspace_member(id)));

create policy "users create workspaces they own"
  on public.workspaces for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "admins update their workspace"
  on public.workspaces for update to authenticated
  using ((select private.can_admin_workspace(id)))
  with check ((select private.can_admin_workspace(id)));

create policy "owners delete their workspace"
  on public.workspaces for delete to authenticated
  using ((select private.workspace_role(id)) = 'owner');

-- ---------------------------------------------------------------------------
-- workspace_members
-- ---------------------------------------------------------------------------

create policy "members read the membership list"
  on public.workspace_members for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "admins or the workspace owner add members"
  on public.workspace_members for insert to authenticated
  with check (
    (select private.can_admin_workspace(workspace_id))
    or (select private.owns_workspace(workspace_id))
  );

create policy "admins update members"
  on public.workspace_members for update to authenticated
  using ((select private.can_admin_workspace(workspace_id)))
  with check ((select private.can_admin_workspace(workspace_id)));

create policy "admins remove members"
  on public.workspace_members for delete to authenticated
  using ((select private.can_admin_workspace(workspace_id)));

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

create policy "members read accounts"
  on public.accounts for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "writers create accounts"
  on public.accounts for insert to authenticated
  with check (
    (select private.can_write_workspace(workspace_id))
    and created_by = (select auth.uid())
  );

create policy "writers update accounts"
  on public.accounts for update to authenticated
  using ((select private.can_write_workspace(workspace_id)))
  with check ((select private.can_write_workspace(workspace_id)));

create policy "writers delete accounts"
  on public.accounts for delete to authenticated
  using ((select private.can_write_workspace(workspace_id)));

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create policy "members read categories"
  on public.categories for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "writers create categories"
  on public.categories for insert to authenticated
  with check (
    (select private.can_write_workspace(workspace_id))
    and created_by = (select auth.uid())
  );

create policy "writers update categories"
  on public.categories for update to authenticated
  using ((select private.can_write_workspace(workspace_id)))
  with check ((select private.can_write_workspace(workspace_id)));

create policy "writers delete categories"
  on public.categories for delete to authenticated
  using ((select private.can_write_workspace(workspace_id)));

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------

create policy "members read transactions"
  on public.transactions for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "writers create transactions"
  on public.transactions for insert to authenticated
  with check (
    (select private.can_write_workspace(workspace_id))
    and created_by = (select auth.uid())
  );

create policy "writers update transactions"
  on public.transactions for update to authenticated
  using ((select private.can_write_workspace(workspace_id)))
  with check ((select private.can_write_workspace(workspace_id)));

create policy "writers delete transactions"
  on public.transactions for delete to authenticated
  using ((select private.can_write_workspace(workspace_id)));

-- ---------------------------------------------------------------------------
-- transfers
-- ---------------------------------------------------------------------------

create policy "members read transfers"
  on public.transfers for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "writers create transfers"
  on public.transfers for insert to authenticated
  with check (
    (select private.can_write_workspace(workspace_id))
    and created_by = (select auth.uid())
  );

create policy "writers update transfers"
  on public.transfers for update to authenticated
  using ((select private.can_write_workspace(workspace_id)))
  with check ((select private.can_write_workspace(workspace_id)));

create policy "writers delete transfers"
  on public.transfers for delete to authenticated
  using ((select private.can_write_workspace(workspace_id)));

-- ---------------------------------------------------------------------------
-- transfer_entries — read-only to every client.
--
-- There is deliberately no insert/update/delete policy. Entries exist solely as
-- the trigger-maintained mirror of public.transfers, so they cannot be forged
-- or left inconsistent with their parent transfer by any client write path.
-- ---------------------------------------------------------------------------

create policy "members read transfer entries"
  on public.transfer_entries for select to authenticated
  using (
    exists (
      select 1
      from public.transfers t
      where t.id = transfer_entries.transfer_id
        and (select private.is_workspace_member(t.workspace_id))
    )
  );
