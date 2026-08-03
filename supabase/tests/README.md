# Database verification

These scripts assert the behaviour the application depends on: onboarding,
balance arithmetic, transfer atomicity, and tenant isolation. They are written
against a **local** stack and will insert test users — never run them against a
database with real data.

```bash
supabase db reset          # rebuild from migrations
PG=postgresql://postgres:postgres@127.0.0.1:54322/postgres
psql "$PG" -X -q -f supabase/tests/01_onboarding.sql
psql "$PG" -X -q -f supabase/tests/02_financial_matrix.sql
psql "$PG" -X -q -f supabase/tests/03_rls_isolation.sql
```

Every assertion raises on failure, so a clean run means everything passed.

| Script | Covers |
|---|---|
| `01_onboarding.sql` | Signing up creates a profile, a `Personal` workspace, an owner membership and 25 default categories |
| `02_financial_matrix.sql` | Add/edit/delete of expense, income and transfer; balances after each; transfers never touch income/expense totals or net worth; same-account, zero-amount and mismatched-category writes rejected; accounts with history cannot be hard-deleted; clients cannot write `transfer_entries` |
| `03_rls_isolation.sql` | A second user with Alice's real row IDs sees 0 rows in every table and view, and every insert/update/delete/RPC against her workspace is refused. Anonymous access is denied everywhere. |

`02` and `03` run as the Supabase `authenticated` role with a forged JWT claim,
so they exercise the same RLS path the application does.
