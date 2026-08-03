-- Expensio — the financial layer
--
-- Every balance and aggregate the application shows is derived here, so the
-- formulas exist in exactly one place and cannot drift between components.
--
-- Views use `security_invoker = true` and the functions are SECURITY INVOKER,
-- so RLS on the underlying tables still applies to every read.

-- ---------------------------------------------------------------------------
-- account_balances — the one and only definition of an account balance:
--
--   initial_balance + income - expenses + transfers in - transfers out
-- ---------------------------------------------------------------------------

create view public.account_balances
with (security_invoker = true) as
select
  a.id                as account_id,
  a.workspace_id,
  a.name,
  a.type,
  a.currency,
  a.is_active,
  a.initial_balance,
  a.initial_balance
    + coalesce(t.income, 0)
    - coalesce(t.expenses, 0)
    + coalesce(e.moved_in, 0)
    - coalesce(e.moved_out, 0) as balance
from public.accounts a
left join lateral (
  select
    sum(tx.amount) filter (where tx.type = 'income')  as income,
    sum(tx.amount) filter (where tx.type = 'expense') as expenses
  from public.transactions tx
  where tx.account_id = a.id
) t on true
left join lateral (
  select
    sum(en.amount) filter (where en.direction = 'in')  as moved_in,
    sum(en.amount) filter (where en.direction = 'out') as moved_out
  from public.transfer_entries en
  where en.account_id = a.id
) e on true;

comment on view public.account_balances is
  'Authoritative per-account balance. Transfers move value between accounts without changing the workspace total.';

-- ---------------------------------------------------------------------------
-- ledger_entries — transactions and transfers as one feed, so the transactions
-- page can filter, sort and paginate server-side in a single query.
--
-- signed_amount is 0 for transfers: they are movements, not income or expense,
-- and must never contribute to either total.
-- ---------------------------------------------------------------------------

create view public.ledger_entries
with (security_invoker = true) as
select
  t.id,
  t.type::text                                              as kind,
  t.workspace_id,
  t.transaction_date                                        as entry_date,
  t.description,
  t.notes,
  t.amount,
  case when t.type = 'income' then t.amount else -t.amount end as signed_amount,
  t.currency,
  t.account_id,
  a.name                                                    as account_name,
  null::uuid                                                as to_account_id,
  null::varchar(150)                                        as to_account_name,
  t.category_id,
  c.name                                                    as category_name,
  parent.name                                               as parent_category_name,
  t.created_at
from public.transactions t
join public.accounts a on a.id = t.account_id
left join public.categories c on c.id = t.category_id
left join public.categories parent on parent.id = c.parent_id

union all

select
  tr.id,
  'transfer'::text                                          as kind,
  tr.workspace_id,
  tr.transfer_date                                          as entry_date,
  tr.description,
  tr.notes,
  tr.amount,
  0::numeric(19, 4)                                         as signed_amount,
  tr.currency,
  tr.from_account_id                                        as account_id,
  src.name                                                  as account_name,
  tr.to_account_id,
  dst.name                                                  as to_account_name,
  null::uuid                                                as category_id,
  null::varchar(100)                                        as category_name,
  null::varchar(100)                                        as parent_category_name,
  tr.created_at
from public.transfers tr
join public.accounts src on src.id = tr.from_account_id
join public.accounts dst on dst.id = tr.to_account_id;

comment on view public.ledger_entries is
  'Unified transaction + transfer feed. kind is income | expense | transfer.';

revoke all on public.account_balances, public.ledger_entries from anon;
grant select on public.account_balances, public.ledger_entries to authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard aggregates
-- ---------------------------------------------------------------------------

create or replace function public.get_dashboard_summary(
  p_workspace_id uuid,
  p_from date,
  p_to date
)
returns table (
  total_balance numeric,
  income numeric,
  expenses numeric,
  net numeric,
  savings_rate numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_income numeric;
  v_expenses numeric;
begin
  if not private.is_workspace_member(p_workspace_id) then
    raise exception 'Not a member of this workspace' using errcode = '42501';
  end if;

  select
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)
  into v_income, v_expenses
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.transaction_date between p_from and p_to;

  return query
  select
    coalesce((
      select sum(b.balance)
      from public.account_balances b
      where b.workspace_id = p_workspace_id
    ), 0)::numeric,
    v_income,
    v_expenses,
    v_income - v_expenses,
    case when v_income > 0
      then round(((v_income - v_expenses) / v_income) * 100, 1)
      else 0
    end;
end;
$$;

-- Income vs expenses bucketed by day or month across the period.
create or replace function public.get_income_expense_series(
  p_workspace_id uuid,
  p_from date,
  p_to date,
  p_granularity text default 'month'
)
returns table (
  bucket date,
  income numeric,
  expenses numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_unit text;
begin
  if not private.is_workspace_member(p_workspace_id) then
    raise exception 'Not a member of this workspace' using errcode = '42501';
  end if;

  v_unit := case when p_granularity = 'day' then 'day' else 'month' end;

  return query
  with buckets as (
    select generate_series(
      date_trunc(v_unit, p_from::timestamp),
      date_trunc(v_unit, p_to::timestamp),
      ('1 ' || v_unit)::interval
    )::date as bucket
  ),
  totals as (
    select
      date_trunc(v_unit, t.transaction_date::timestamp)::date as bucket,
      coalesce(sum(t.amount) filter (where t.type = 'income'), 0) as income,
      coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as expenses
    from public.transactions t
    where t.workspace_id = p_workspace_id
      and t.transaction_date between p_from and p_to
    group by 1
  )
  select
    b.bucket,
    coalesce(x.income, 0)::numeric,
    coalesce(x.expenses, 0)::numeric
  from buckets b
  left join totals x on x.bucket = b.bucket
  order by b.bucket;
end;
$$;

-- Spending grouped by root category (children roll up into their parent),
-- largest first. Uncategorised spend is reported as 'Uncategorised'.
create or replace function public.get_spending_by_category(
  p_workspace_id uuid,
  p_from date,
  p_to date
)
returns table (
  category_id uuid,
  category_name text,
  total numeric,
  percentage numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not private.is_workspace_member(p_workspace_id) then
    raise exception 'Not a member of this workspace' using errcode = '42501';
  end if;

  return query
  with spend as (
    select
      coalesce(parent.id, c.id) as root_id,
      coalesce(parent.name, c.name, 'Uncategorised')::text as root_name,
      t.amount
    from public.transactions t
    left join public.categories c on c.id = t.category_id
    left join public.categories parent on parent.id = c.parent_id
    where t.workspace_id = p_workspace_id
      and t.type = 'expense'
      and t.transaction_date between p_from and p_to
  ),
  grouped as (
    -- `spent`, not `total`: `total` is one of this function's OUT parameters and
    -- an unqualified reference to it here would be ambiguous.
    select spend.root_id, spend.root_name, sum(spend.amount) as spent
    from spend
    group by spend.root_id, spend.root_name
  ),
  overall as (
    select coalesce(sum(grouped.spent), 0) as grand_total from grouped
  )
  select
    g.root_id,
    g.root_name,
    g.spent,
    case when o.grand_total > 0
      then round((g.spent / o.grand_total) * 100, 1)
      else 0
    end
  from grouped g
  cross join overall o
  order by g.spent desc;
end;
$$;

revoke all on function
  public.get_dashboard_summary(uuid, date, date),
  public.get_income_expense_series(uuid, date, date, text),
  public.get_spending_by_category(uuid, date, date)
from public, anon;

grant execute on function
  public.get_dashboard_summary(uuid, date, date),
  public.get_income_expense_series(uuid, date, date, text),
  public.get_spending_by_category(uuid, date, date)
to authenticated;
