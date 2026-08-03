-- Expensio — expose money as text over the API
--
-- PostgREST serialises `numeric` as a JSON *number*, so every amount would be
-- parsed into a JavaScript double before the application ever saw it. That is
-- precisely the floating-point exposure a ledger must not have.
--
-- Casting the money columns to text keeps the exact decimal representation all
-- the way to the client, where lib/money.ts parses it into integer minor units.
-- Percentages stay numeric: they are display-only and never summed.

drop view if exists public.account_balances;
drop view if exists public.ledger_entries;

create view public.account_balances
with (security_invoker = true) as
select
  a.id                as account_id,
  a.workspace_id,
  a.name,
  a.type,
  a.currency,
  a.is_active,
  a.initial_balance::text as initial_balance,
  (
    a.initial_balance
      + coalesce(t.income, 0)
      - coalesce(t.expenses, 0)
      + coalesce(e.moved_in, 0)
      - coalesce(e.moved_out, 0)
  )::text as balance
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
  'Authoritative per-account balance. Transfers move value between accounts without changing the workspace total. Money is text to preserve exact decimals over the API.';

create view public.ledger_entries
with (security_invoker = true) as
select
  t.id,
  t.type::text                                         as kind,
  t.workspace_id,
  t.transaction_date                                   as entry_date,
  t.description,
  t.notes,
  t.amount::text                                       as amount,
  (case when t.type = 'income' then t.amount else -t.amount end)::text
                                                       as signed_amount,
  t.currency,
  t.account_id,
  a.name                                               as account_name,
  null::uuid                                           as to_account_id,
  null::varchar(150)                                   as to_account_name,
  t.category_id,
  c.name                                               as category_name,
  parent.name                                          as parent_category_name,
  t.created_at
from public.transactions t
join public.accounts a on a.id = t.account_id
left join public.categories c on c.id = t.category_id
left join public.categories parent on parent.id = c.parent_id

union all

select
  tr.id,
  'transfer'::text                                     as kind,
  tr.workspace_id,
  tr.transfer_date                                     as entry_date,
  tr.description,
  tr.notes,
  tr.amount::text                                      as amount,
  '0'::text                                            as signed_amount,
  tr.currency,
  tr.from_account_id                                   as account_id,
  src.name                                             as account_name,
  tr.to_account_id,
  dst.name                                             as to_account_name,
  null::uuid                                           as category_id,
  null::varchar(100)                                   as category_name,
  null::varchar(100)                                   as parent_category_name,
  tr.created_at
from public.transfers tr
join public.accounts src on src.id = tr.from_account_id
join public.accounts dst on dst.id = tr.to_account_id;

comment on view public.ledger_entries is
  'Unified transaction + transfer feed. kind is income | expense | transfer; signed_amount is 0 for transfers so they never count as income or expense.';

revoke all on public.account_balances, public.ledger_entries from anon;
grant select on public.account_balances, public.ledger_entries to authenticated;

-- ---------------------------------------------------------------------------
-- Aggregates, same change: money out as text.
-- ---------------------------------------------------------------------------

drop function if exists public.get_dashboard_summary(uuid, date, date);

create function public.get_dashboard_summary(
  p_workspace_id uuid,
  p_from date,
  p_to date
)
returns table (
  total_balance text,
  income text,
  expenses text,
  net text,
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
  v_balance numeric;
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

  select coalesce(sum(b.balance::numeric), 0)
  into v_balance
  from public.account_balances b
  where b.workspace_id = p_workspace_id;

  return query
  select
    v_balance::text,
    v_income::text,
    v_expenses::text,
    (v_income - v_expenses)::text,
    case when v_income > 0
      then round(((v_income - v_expenses) / v_income) * 100, 1)
      else 0
    end;
end;
$$;

drop function if exists public.get_income_expense_series(uuid, date, date, text);

create function public.get_income_expense_series(
  p_workspace_id uuid,
  p_from date,
  p_to date,
  p_granularity text default 'month'
)
returns table (
  bucket date,
  income text,
  expenses text
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
    coalesce(x.income, 0)::text,
    coalesce(x.expenses, 0)::text
  from buckets b
  left join totals x on x.bucket = b.bucket
  order by b.bucket;
end;
$$;

drop function if exists public.get_spending_by_category(uuid, date, date);

create function public.get_spending_by_category(
  p_workspace_id uuid,
  p_from date,
  p_to date
)
returns table (
  category_id uuid,
  category_name text,
  total text,
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
    g.spent::text,
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
