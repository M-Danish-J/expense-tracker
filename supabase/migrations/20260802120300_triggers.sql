-- Expensio — triggers: timestamps, onboarding, transfer entries, integrity
--
-- Business rules that must hold no matter which client writes the row live
-- here rather than in the application.

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger workspaces_set_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger workspace_members_set_updated_at before update on public.workspace_members
  for each row execute function public.set_updated_at();
create trigger accounts_set_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger transfers_set_updated_at before update on public.transfers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Default categories
-- ---------------------------------------------------------------------------

create or replace function public.seed_default_categories(ws_id uuid, author_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  entry jsonb;
  child_name text;
  v_parent_id uuid;
  defaults jsonb := '[
    {"name": "Food",          "type": "expense", "children": ["Groceries", "Restaurants", "Fast Food"]},
    {"name": "Transport",     "type": "expense", "children": ["Fuel", "Uber", "Public Transport"]},
    {"name": "Bills",         "type": "expense", "children": ["Electricity", "Internet", "Mobile"]},
    {"name": "Housing",       "type": "expense", "children": ["Rent", "Maintenance"]},
    {"name": "Shopping",      "type": "expense", "children": []},
    {"name": "Health",        "type": "expense", "children": []},
    {"name": "Entertainment", "type": "expense", "children": []},
    {"name": "Other",         "type": "expense", "children": []},
    {"name": "Salary",        "type": "income",  "children": []},
    {"name": "Freelance",     "type": "income",  "children": []},
    {"name": "Business",      "type": "income",  "children": []},
    {"name": "Bonus",         "type": "income",  "children": []},
    {"name": "Gift",          "type": "income",  "children": []},
    {"name": "Other",         "type": "income",  "children": []}
  ]'::jsonb;
begin
  for entry in select value from jsonb_array_elements(defaults) loop
    insert into public.categories (workspace_id, name, type, created_by)
    values (ws_id, entry ->> 'name', entry ->> 'type', author_id)
    returning id into v_parent_id;

    for child_name in select jsonb_array_elements_text(entry -> 'children') loop
      insert into public.categories (workspace_id, parent_id, name, type, created_by)
      values (ws_id, v_parent_id, child_name, entry ->> 'type', author_id);
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Onboarding: every new auth user gets a profile, a personal workspace, an
-- owner membership and the default category tree — in one transaction.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
  display_name text;
  currency text;
begin
  display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  currency := upper(coalesce(nullif(new.raw_user_meta_data ->> 'preferred_currency', ''), 'PKR'));

  insert into public.profiles (id, full_name, preferred_currency)
  values (new.id, display_name, currency)
  on conflict (id) do nothing;

  insert into public.workspaces (name, owner_id, default_currency)
  values ('Personal', new.id, currency)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  perform public.seed_default_categories(new_workspace_id, new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- transfer_entries are a trigger-maintained mirror of transfers.
--
-- One statement on `transfers` rewrites both entries inside the same
-- transaction, so the pair can never drift from its parent or from each other.
-- SECURITY DEFINER because no client role holds write access to the table.
-- ---------------------------------------------------------------------------

create or replace function public.sync_transfer_entries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.transfer_entries where transfer_id = new.id;

  insert into public.transfer_entries (transfer_id, account_id, direction, amount)
  values
    (new.id, new.from_account_id, 'out', new.amount),
    (new.id, new.to_account_id,   'in',  new.amount);

  return new;
end;
$$;

create trigger transfers_sync_entries
  after insert or update of from_account_id, to_account_id, amount on public.transfers
  for each row execute function public.sync_transfer_entries();

-- ---------------------------------------------------------------------------
-- Integrity: cross-table rules the column constraints cannot express
-- ---------------------------------------------------------------------------

-- An account's currency is the workspace's currency. The MVP has no FX rates,
-- so mixed-currency workspaces would produce meaningless totals.
create or replace function public.validate_account()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ws_currency text;
begin
  select w.default_currency into ws_currency
  from public.workspaces w
  where w.id = new.workspace_id;

  if ws_currency is null then
    raise exception 'Workspace % does not exist', new.workspace_id;
  end if;

  if new.currency is distinct from ws_currency then
    raise exception 'Account currency (%) must match the workspace currency (%)',
      new.currency, ws_currency;
  end if;

  return new;
end;
$$;

create trigger accounts_validate before insert or update on public.accounts
  for each row execute function public.validate_account();

-- A category's parent must be in the same workspace, share its type, and be a
-- root — the tree is deliberately two levels deep.
create or replace function public.validate_category()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent record;
begin
  if new.parent_id is null then
    return new;
  end if;

  select c.workspace_id, c.type, c.parent_id into parent
  from public.categories c
  where c.id = new.parent_id;

  if not found then
    raise exception 'Parent category does not exist';
  end if;

  if parent.workspace_id <> new.workspace_id then
    raise exception 'Parent category belongs to a different workspace';
  end if;

  if parent.type <> new.type then
    raise exception 'A % category cannot sit under a % category', new.type, parent.type;
  end if;

  if parent.parent_id is not null then
    raise exception 'Categories support two levels only';
  end if;

  return new;
end;
$$;

create trigger categories_validate before insert or update on public.categories
  for each row execute function public.validate_category();

-- A transaction's account and category must belong to its workspace, the
-- category type must match the transaction type, and the currency must match
-- the account.
create or replace function public.validate_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  acct record;
  cat record;
begin
  select a.workspace_id, a.currency, a.is_active into acct
  from public.accounts a
  where a.id = new.account_id;

  if not found then
    raise exception 'Account does not exist';
  end if;

  if acct.workspace_id <> new.workspace_id then
    raise exception 'Account belongs to a different workspace';
  end if;

  if new.currency is distinct from acct.currency then
    raise exception 'Transaction currency (%) must match the account currency (%)',
      new.currency, acct.currency;
  end if;

  if tg_op = 'INSERT' and not acct.is_active then
    raise exception 'Cannot add a transaction to an inactive account';
  end if;

  if new.category_id is not null then
    select c.workspace_id, c.type, c.is_active into cat
    from public.categories c
    where c.id = new.category_id;

    if not found then
      raise exception 'Category does not exist';
    end if;

    if cat.workspace_id <> new.workspace_id then
      raise exception 'Category belongs to a different workspace';
    end if;

    if cat.type <> new.type then
      raise exception 'A % transaction cannot use a % category', new.type, cat.type;
    end if;

    if tg_op = 'INSERT' and not cat.is_active then
      raise exception 'Cannot use an inactive category';
    end if;
  end if;

  return new;
end;
$$;

create trigger transactions_validate before insert or update on public.transactions
  for each row execute function public.validate_transaction();

-- Both sides of a transfer must live in the transfer's workspace and share its
-- currency. (from <> to is a table constraint.)
create or replace function public.validate_transfer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  src record;
  dst record;
begin
  select a.workspace_id, a.currency, a.is_active into src
  from public.accounts a where a.id = new.from_account_id;

  if not found then
    raise exception 'Source account does not exist';
  end if;

  select a.workspace_id, a.currency, a.is_active into dst
  from public.accounts a where a.id = new.to_account_id;

  if not found then
    raise exception 'Destination account does not exist';
  end if;

  if src.workspace_id <> new.workspace_id or dst.workspace_id <> new.workspace_id then
    raise exception 'Both transfer accounts must belong to the workspace';
  end if;

  if new.currency is distinct from src.currency or new.currency is distinct from dst.currency then
    raise exception 'Transfer currency (%) must match both accounts', new.currency;
  end if;

  if tg_op = 'INSERT' and (not src.is_active or not dst.is_active) then
    raise exception 'Cannot transfer using an inactive account';
  end if;

  return new;
end;
$$;

create trigger transfers_validate before insert or update on public.transfers
  for each row execute function public.validate_transfer();

-- ---------------------------------------------------------------------------
-- Postgres grants EXECUTE on new functions to PUBLIC by default. None of the
-- above is meant to be callable directly by a client.
-- ---------------------------------------------------------------------------

revoke all on function
  public.set_updated_at(),
  public.seed_default_categories(uuid, uuid),
  public.handle_new_user(),
  public.sync_transfer_entries(),
  public.validate_account(),
  public.validate_category(),
  public.validate_transaction(),
  public.validate_transfer()
from public, anon, authenticated;
