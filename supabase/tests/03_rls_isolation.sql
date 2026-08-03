\set ON_ERROR_STOP on
\pset pager off

-- Capture Alice's real IDs with elevated rights, the way leaked or guessed
-- UUIDs would reach an attacker. Bob will then try to use them directly.
select
  w.id  as alice_ws,
  (select a.id from public.accounts a where a.workspace_id = w.id order by a.name limit 1) as alice_account,
  (select c.id from public.categories c where c.workspace_id = w.id and c.name = 'Groceries' limit 1) as alice_category,
  (select t.id from public.transactions t where t.workspace_id = w.id limit 1) as alice_tx,
  (select tr.id from public.transfers tr where tr.workspace_id = w.id limit 1) as alice_transfer
from public.workspaces w
where w.owner_id = '11111111-1111-1111-1111-111111111111'
\gset

-- psql only interpolates :vars outside dollar-quoted bodies, so stash them in
-- session settings the DO block can read back.
select set_config('t.ws', :'alice_ws', false),
       set_config('t.account', :'alice_account', false),
       set_config('t.category', :'alice_category', false),
       set_config('t.tx', :'alice_tx', false),
       set_config('t.transfer', :'alice_transfer', false) \g /dev/null

\echo '=== RLS CROSS-TENANT ISOLATION (as Bob, using Alice''s real row IDs) ==='

set role authenticated;
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
-- Older local containers define auth.uid() against this legacy GUC.
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

\echo '--- reads: rows of Alice''s that Bob can see (every count must be 0) ---'
select 'workspaces'  as "table", count(*) as "alice rows visible to bob" from public.workspaces       where id           = :'alice_ws'
union all select 'workspace_members', count(*) from public.workspace_members where workspace_id = :'alice_ws'
union all select 'accounts',          count(*) from public.accounts          where workspace_id = :'alice_ws'
union all select 'categories',        count(*) from public.categories        where workspace_id = :'alice_ws'
union all select 'transactions',      count(*) from public.transactions      where workspace_id = :'alice_ws'
union all select 'transfers',         count(*) from public.transfers         where workspace_id = :'alice_ws'
union all select 'transfer_entries',  count(*) from public.transfer_entries  where transfer_id  = :'alice_transfer'
union all select 'account_balances',  count(*) from public.account_balances  where workspace_id = :'alice_ws'
union all select 'ledger_entries',    count(*) from public.ledger_entries    where workspace_id = :'alice_ws'
union all select 'profiles',          count(*) from public.profiles          where id           = '11111111-1111-1111-1111-111111111111';

\echo ''
\echo '--- writes: every attempt must be refused ---'
do $$
declare
  bob uuid := '22222222-2222-2222-2222-222222222222';
  a_ws uuid       := current_setting('t.ws')::uuid;
  a_account uuid  := current_setting('t.account')::uuid;
  a_category uuid := current_setting('t.category')::uuid;
  a_tx uuid       := current_setting('t.tx')::uuid;
  a_transfer uuid := current_setting('t.transfer')::uuid;
  n int;
begin
  begin
    insert into public.accounts (workspace_id, name, type, currency, initial_balance, created_by)
    values (a_ws, 'Bob backdoor', 'cash', 'PKR', 999999, bob);
    raise exception 'FAIL: Bob inserted an account into Alice workspace';
  exception when others then
    raise notice 'PASS  insert account into Alice workspace      -> refused (%)', sqlerrm;
  end;

  begin
    insert into public.transactions (workspace_id, account_id, category_id, type, amount,
                                     currency, transaction_date, created_by)
    values (a_ws, a_account, a_category, 'expense', 100, 'PKR', current_date, bob);
    raise exception 'FAIL: Bob inserted a transaction into Alice workspace';
  exception when others then
    raise notice 'PASS  insert transaction into Alice workspace  -> refused (%)', sqlerrm;
  end;

  begin
    insert into public.transfers (workspace_id, from_account_id, to_account_id, amount,
                                  currency, transfer_date, created_by)
    values (a_ws, a_account, a_account, 100, 'PKR', current_date, bob);
    raise exception 'FAIL: Bob inserted a transfer into Alice workspace';
  exception when others then
    raise notice 'PASS  insert transfer into Alice workspace     -> refused (%)', sqlerrm;
  end;

  begin
    insert into public.workspace_members (workspace_id, user_id, role)
    values (a_ws, bob, 'owner');
    raise exception 'FAIL: Bob added himself to Alice workspace';
  exception when others then
    raise notice 'PASS  add self to Alice workspace              -> refused (%)', sqlerrm;
  end;

  begin
    insert into public.transfer_entries (transfer_id, account_id, direction, amount)
    values (a_transfer, a_account, 'in', 999999);
    raise exception 'FAIL: Bob forged a transfer entry';
  exception when others then
    raise notice 'PASS  forge transfer_entries row              -> refused (%)', sqlerrm;
  end;

  -- Updates and deletes affect zero rows under RLS rather than raising.
  update public.transactions set amount = 1 where id = a_tx;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: Bob updated Alice transaction';
  raise notice 'PASS  update Alice transaction                 -> 0 rows affected';

  update public.accounts set name = 'hacked' where id = a_account;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: Bob renamed Alice account';
  raise notice 'PASS  rename Alice account                     -> 0 rows affected';

  delete from public.transactions where id = a_tx;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: Bob deleted Alice transaction';
  raise notice 'PASS  delete Alice transaction                 -> 0 rows affected';

  delete from public.transfers where id = a_transfer;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: Bob deleted Alice transfer';
  raise notice 'PASS  delete Alice transfer                    -> 0 rows affected';

  update public.workspaces set name = 'Bob owns this now' where id = a_ws;
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: Bob renamed Alice workspace';
  raise notice 'PASS  rename Alice workspace                   -> 0 rows affected';

  begin
    perform public.get_dashboard_summary(a_ws, current_date - 30, current_date);
    raise exception 'FAIL: Bob read Alice dashboard summary';
  exception when insufficient_privilege then
    raise notice 'PASS  get_dashboard_summary on Alice workspace -> refused';
  end;

  begin
    perform public.get_spending_by_category(a_ws, current_date - 30, current_date);
    raise exception 'FAIL: Bob read Alice category spending';
  exception when insufficient_privilege then
    raise notice 'PASS  get_spending_by_category on Alice ws     -> refused';
  end;

  begin
    perform public.get_income_expense_series(a_ws, current_date - 30, current_date, 'month');
    raise exception 'FAIL: Bob read Alice chart series';
  exception when insufficient_privilege then
    raise notice 'PASS  get_income_expense_series on Alice ws    -> refused';
  end;

  raise notice '--- cross-tenant isolation holds ---';
end $$;

\echo ''
\echo '=== ANONYMOUS ACCESS (must be denied on every table and view) ==='
reset role;
set role anon;
set request.jwt.claims = '{"role":"anon"}';
do $$
declare t text;
begin
  foreach t in array array['profiles','workspaces','workspace_members','accounts',
                           'categories','transactions','transfers','transfer_entries',
                           'account_balances','ledger_entries']
  loop
    begin
      execute format('select 1 from public.%I limit 1', t);
      raise exception 'FAIL: anon could query %', t;
    exception when insufficient_privilege then
      raise notice 'PASS  anon denied on %', t;
    end;
  end loop;
end $$;
reset role;
