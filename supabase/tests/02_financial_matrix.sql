\set ON_ERROR_STOP on
\pset pager off

-- Run everything below exactly as the Supabase `authenticated` role would, with
-- Alice's JWT. Every statement therefore passes through RLS.
set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
-- Older local containers define auth.uid() against this legacy GUC.
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

\echo '=== FINANCIAL MATRIX (as Alice, through RLS) ==='
do $$
declare
  alice uuid := '11111111-1111-1111-1111-111111111111';
  ws uuid; cash uuid; bank uuid; cat_food uuid; cat_salary uuid;
  tx_expense uuid; tx_income uuid; tr uuid;
  bal_cash numeric; bal_bank numeric; s record;
begin
  select id into ws from public.workspaces limit 1;
  select id into cat_food from public.categories where workspace_id = ws and name = 'Groceries';
  select id into cat_salary from public.categories where workspace_id = ws and name = 'Salary';

  insert into public.accounts (workspace_id, name, type, currency, initial_balance, created_by)
  values (ws, 'Cash', 'cash', 'PKR', 5000, alice) returning id into cash;
  insert into public.accounts (workspace_id, name, type, currency, initial_balance, created_by)
  values (ws, 'Meezan Bank', 'bank', 'PKR', 100000, alice) returning id into bank;

  select balance into bal_cash from public.account_balances where account_id = cash;
  select balance into bal_bank from public.account_balances where account_id = bank;
  assert bal_cash = 5000 and bal_bank = 100000, 'initial balances wrong';
  raise notice 'PASS  initial balances (cash %, bank %)', bal_cash, bal_bank;

  insert into public.transactions (workspace_id, account_id, category_id, type, amount,
                                   currency, description, transaction_date, created_by)
  values (ws, cash, cat_food, 'expense', 1500, 'PKR', 'Groceries', current_date, alice)
  returning id into tx_expense;
  select balance into bal_cash from public.account_balances where account_id = cash;
  assert bal_cash = 3500, format('expected 3500, got %s', bal_cash);
  raise notice 'PASS  add expense       cash %', bal_cash;

  insert into public.transactions (workspace_id, account_id, category_id, type, amount,
                                   currency, description, transaction_date, created_by)
  values (ws, bank, cat_salary, 'income', 50000, 'PKR', 'July salary', current_date, alice)
  returning id into tx_income;
  select balance into bal_bank from public.account_balances where account_id = bank;
  assert bal_bank = 150000, format('expected 150000, got %s', bal_bank);
  raise notice 'PASS  add income        bank %', bal_bank;

  select * into s from public.get_dashboard_summary(ws, current_date - 30, current_date + 1);
  assert s.income::numeric = 50000 and s.expenses::numeric = 1500 and s.total_balance::numeric = 153500,
    format('summary wrong: %s / %s / %s', s.income::numeric, s.expenses::numeric, s.total_balance);
  raise notice 'PASS  summary           income % expenses % net worth %',
    s.income::numeric, s.expenses::numeric, s.total_balance;

  insert into public.transfers (workspace_id, from_account_id, to_account_id, amount,
                                currency, description, transfer_date, created_by)
  values (ws, bank, cash, 20000, 'PKR', 'ATM withdrawal', current_date, alice)
  returning id into tr;
  assert (select count(*) from public.transfer_entries where transfer_id = tr) = 2,
    'transfer must produce exactly two entries';
  select balance into bal_cash from public.account_balances where account_id = cash;
  select balance into bal_bank from public.account_balances where account_id = bank;
  assert bal_cash = 23500 and bal_bank = 130000,
    format('transfer balances wrong: %s / %s', bal_cash, bal_bank);
  select * into s from public.get_dashboard_summary(ws, current_date - 30, current_date + 1);
  assert s.income::numeric = 50000 and s.expenses::numeric = 1500,
    format('TRANSFER LEAKED INTO INCOME/EXPENSE: % / %', s.income::numeric, s.expenses);
  assert s.total_balance::numeric = 153500, format('transfer changed net worth: %s', s.total_balance);
  raise notice 'PASS  create transfer   cash % bank % | income/expenses untouched, net worth still %',
    bal_cash, bal_bank, s.total_balance;

  update public.transactions set amount = 2000 where id = tx_expense;
  select balance into bal_cash from public.account_balances where account_id = cash;
  assert bal_cash = 23000, format('expected 23000, got %s', bal_cash);
  raise notice 'PASS  edit expense      cash %', bal_cash;

  update public.transactions set amount = 55000 where id = tx_income;
  select balance into bal_bank from public.account_balances where account_id = bank;
  assert bal_bank = 135000, format('expected 135000, got %s', bal_bank);
  raise notice 'PASS  edit income       bank %', bal_bank;

  update public.transfers set amount = 30000 where id = tr;
  select balance into bal_cash from public.account_balances where account_id = cash;
  select balance into bal_bank from public.account_balances where account_id = bank;
  assert bal_cash = 33000 and bal_bank = 125000,
    format('transfer edit wrong: %s / %s', bal_cash, bal_bank);
  assert (select amount from public.transfer_entries where transfer_id = tr and direction = 'out') = 30000,
    'entries did not follow the edit';
  raise notice 'PASS  edit transfer     cash % bank % (entries re-synced)', bal_cash, bal_bank;

  update public.transfers set from_account_id = cash, to_account_id = bank where id = tr;
  select balance into bal_cash from public.account_balances where account_id = cash;
  select balance into bal_bank from public.account_balances where account_id = bank;
  assert bal_cash = -27000 and bal_bank = 185000,
    format('account swap wrong: %s / %s', bal_cash, bal_bank);
  raise notice 'PASS  swap transfer     cash % bank %', bal_cash, bal_bank;
  update public.transfers set from_account_id = bank, to_account_id = cash where id = tr;

  delete from public.transfers where id = tr;
  assert (select count(*) from public.transfer_entries where transfer_id = tr) = 0,
    'entries must cascade';
  select balance into bal_cash from public.account_balances where account_id = cash;
  select balance into bal_bank from public.account_balances where account_id = bank;
  assert bal_cash = 3000 and bal_bank = 155000,
    format('after transfer delete: %s / %s', bal_cash, bal_bank);
  raise notice 'PASS  delete transfer   cash % bank % (entries cascaded)', bal_cash, bal_bank;

  delete from public.transactions where id = tx_expense;
  delete from public.transactions where id = tx_income;
  select balance into bal_cash from public.account_balances where account_id = cash;
  select balance into bal_bank from public.account_balances where account_id = bank;
  assert bal_cash = 5000 and bal_bank = 100000,
    format('after deletes: %s / %s', bal_cash, bal_bank);
  raise notice 'PASS  delete tx         back to initial % / %', bal_cash, bal_bank;

  begin
    insert into public.transfers (workspace_id, from_account_id, to_account_id, amount,
                                  currency, transfer_date, created_by)
    values (ws, cash, cash, 100, 'PKR', current_date, alice);
    raise exception 'FAIL: same-account transfer accepted';
  exception when check_violation then
    raise notice 'PASS  same-account transfer rejected';
  end;

  begin
    insert into public.transactions (workspace_id, account_id, category_id, type, amount,
                                     currency, transaction_date, created_by)
    values (ws, cash, cat_food, 'expense', 0, 'PKR', current_date, alice);
    raise exception 'FAIL: zero amount accepted';
  exception when check_violation then
    raise notice 'PASS  zero amount rejected';
  end;

  begin
    insert into public.transactions (workspace_id, account_id, category_id, type, amount,
                                     currency, transaction_date, created_by)
    values (ws, cash, cat_food, 'income', 100, 'PKR', current_date, alice);
    raise exception 'FAIL: expense category on income accepted';
  exception when raise_exception then
    raise notice 'PASS  category/type mismatch rejected';
  end;

  insert into public.transactions (workspace_id, account_id, category_id, type, amount,
                                   currency, transaction_date, created_by)
  values (ws, cash, cat_food, 'expense', 10, 'PKR', current_date, alice);
  begin
    delete from public.accounts where id = cash;
    raise exception 'FAIL: account with history deleted';
  exception when foreign_key_violation then
    raise notice 'PASS  account with history protected from hard delete';
  end;

  begin
    insert into public.transfer_entries (transfer_id, account_id, direction, amount)
    values (gen_random_uuid(), cash, 'in', 999);
    raise exception 'FAIL: client wrote a transfer entry directly';
  exception when insufficient_privilege or foreign_key_violation then
    raise notice 'PASS  direct transfer_entries write blocked';
  end;

  -- Leave a realistic data set behind for the ledger/chart checks below and for
  -- the cross-tenant tests that follow.
  insert into public.transactions (workspace_id, account_id, category_id, type, amount,
                                   currency, description, notes, transaction_date, created_by)
  values
    (ws, bank, cat_salary, 'income', 250000, 'PKR', 'July salary', 'Monthly payroll', current_date - 5, alice),
    (ws, cash, cat_food,  'expense', 4200,   'PKR', 'Whole Foods Market', null, current_date - 3, alice),
    (ws, cash, (select id from public.categories where workspace_id = ws and name = 'Fuel'),
                          'expense', 8000,   'PKR', 'Petrol', null, current_date - 2, alice),
    (ws, bank, (select id from public.categories where workspace_id = ws and name = 'Rent'),
                          'expense', 60000,  'PKR', 'Rent payment', null, current_date - 1, alice);

  insert into public.transfers (workspace_id, from_account_id, to_account_id, amount,
                                currency, description, transfer_date, created_by)
  values (ws, bank, cash, 20000, 'PKR', 'ATM withdrawal', current_date, alice);

  raise notice '--- all financial assertions passed ---';
end $$;

\echo ''
\echo '=== LEDGER FEED + CHARTS ==='
select kind, entry_date, description, account_name, to_account_name,
       category_name, amount, signed_amount
from public.ledger_entries order by entry_date desc, created_at desc;

\echo '--- spending by category (roll-up to root categories) ---'
select * from public.get_spending_by_category(
  (select id from public.workspaces limit 1), current_date - 30, current_date + 1);

\echo '--- account balances ---'
select name, initial_balance, balance from public.account_balances order by name;

\echo '--- dashboard summary ---'
select * from public.get_dashboard_summary(
  (select id from public.workspaces limit 1), current_date - 30, current_date + 1);

reset role;
