-- Expensio — core schema
--
-- Implements the finalized DBML verbatim (tables, columns, types, defaults,
-- indexes). Additions beyond the DBML are limited to integrity constraints that
-- DBML cannot express: CHECK constraints derived from the DBML `Note:` lines,
-- positive-amount checks, and foreign-key delete behaviour chosen to protect
-- financial history.

create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name varchar(150),
  avatar_url text,
  preferred_currency varchar(3) not null default 'PKR',
  timezone varchar(100) not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Application profile linked 1:1 to Supabase auth.users';

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  default_currency varchar(3) not null default 'PKR',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_owner_id_idx on public.workspaces (owner_id);

-- ---------------------------------------------------------------------------
-- workspace_members
-- ---------------------------------------------------------------------------

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role varchar(20) not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_members_role_check
    check (role in ('owner', 'admin', 'member', 'viewer'))
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create unique index workspace_members_workspace_user_key
  on public.workspace_members (workspace_id, user_id);

comment on table public.workspace_members is 'Roles: owner, admin, member, viewer';

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name varchar(150) not null,
  type varchar(30) not null,
  currency varchar(3) not null,
  initial_balance numeric(19, 4) not null default 0,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_type_check check (
    type in ('cash', 'bank', 'credit_card', 'wallet', 'savings', 'investment', 'other')
  )
);

create index accounts_workspace_id_idx on public.accounts (workspace_id);
create index accounts_workspace_active_idx on public.accounts (workspace_id, is_active);
create index accounts_created_by_idx on public.accounts (created_by);
create index accounts_updated_by_idx on public.accounts (updated_by);

comment on table public.accounts is 'Types: cash, bank, credit_card, wallet, savings, investment, other';

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  parent_id uuid references public.categories (id) on delete restrict,
  name varchar(100) not null,
  type varchar(20) not null,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_type_check check (type in ('expense', 'income')),
  constraint categories_parent_not_self check (parent_id is null or parent_id <> id)
);

create index categories_workspace_id_idx on public.categories (workspace_id);
create index categories_parent_id_idx on public.categories (parent_id);
create index categories_workspace_type_idx on public.categories (workspace_id, type);
create index categories_workspace_active_idx on public.categories (workspace_id, is_active);
create index categories_created_by_idx on public.categories (created_by);
create index categories_updated_by_idx on public.categories (updated_by);

comment on table public.categories is 'Types: expense, income';

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  category_id uuid references public.categories (id) on delete restrict,
  type varchar(20) not null,
  amount numeric(19, 4) not null,
  currency varchar(3) not null,
  description varchar(255),
  notes text,
  transaction_date date not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_type_check check (type in ('expense', 'income')),
  constraint transactions_amount_positive check (amount > 0)
);

create index transactions_workspace_id_idx on public.transactions (workspace_id);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_created_by_idx on public.transactions (created_by);
create index transactions_updated_by_idx on public.transactions (updated_by);
create index transactions_workspace_date_idx on public.transactions (workspace_id, transaction_date desc);
create index transactions_account_date_idx on public.transactions (account_id, transaction_date desc);
create index transactions_category_date_idx on public.transactions (category_id, transaction_date desc);

comment on table public.transactions is 'Types: expense, income. Amount is always positive.';

-- ---------------------------------------------------------------------------
-- transfers
-- ---------------------------------------------------------------------------

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete restrict,
  to_account_id uuid not null references public.accounts (id) on delete restrict,
  amount numeric(19, 4) not null,
  currency varchar(3) not null,
  description varchar(255),
  notes text,
  transfer_date date not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfers_amount_positive check (amount > 0),
  constraint transfers_distinct_accounts check (from_account_id <> to_account_id)
);

create index transfers_workspace_id_idx on public.transfers (workspace_id);
create index transfers_from_account_id_idx on public.transfers (from_account_id);
create index transfers_to_account_id_idx on public.transfers (to_account_id);
create index transfers_created_by_idx on public.transfers (created_by);
create index transfers_updated_by_idx on public.transfers (updated_by);
create index transfers_workspace_date_idx on public.transfers (workspace_id, transfer_date desc);

comment on table public.transfers is
  'Represents a movement of money between two accounts. Does not affect net worth.';

-- ---------------------------------------------------------------------------
-- transfer_entries
-- ---------------------------------------------------------------------------

create table public.transfer_entries (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  direction varchar(10) not null,
  amount numeric(19, 4) not null,
  created_at timestamptz not null default now(),
  constraint transfer_entries_direction_check check (direction in ('in', 'out')),
  constraint transfer_entries_amount_positive check (amount > 0)
);

create index transfer_entries_transfer_id_idx on public.transfer_entries (transfer_id);
create index transfer_entries_account_id_idx on public.transfer_entries (account_id);
create unique index transfer_entries_transfer_account_key
  on public.transfer_entries (transfer_id, account_id);

comment on table public.transfer_entries is
  'Exactly two logical entries per transfer: one out and one in. Maintained exclusively by triggers on public.transfers.';
