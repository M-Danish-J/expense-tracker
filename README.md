# Expensio

A multi-tenant expense tracker built on Next.js and Supabase. Track expenses,
income and transfers across accounts, with balances and analytics derived from
your entries rather than stored and hoped to stay in sync.

Built for one person to start with, but the ownership model is
`user → membership → workspace → financial data` from day one, so sharing a
workspace later doesn't require a rewrite.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, `cacheComponents`, Turbopack) |
| Language | TypeScript, strict |
| Backend | Supabase — Postgres, Auth, Row Level Security |
| Styling | Tailwind CSS 3 + shadcn/ui primitives |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Toasts | Sonner |

No ORM, no separate API server. The database is the backend.

---

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your project's values
npm run dev
```

`.env.local` needs two variables to run:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

A third is optional and only matters in production:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

It sets the canonical origin used by `<link rel="canonical">`, Open Graph URLs,
`sitemap.xml` and the landing page's JSON-LD (`lib/site.ts`). Unset, it falls
back to the Vercel deployment hostname — which means every preview deploy
declares itself canonical.

There is deliberately **no service-role key**. The application never needs one:
every query runs as the signed-in user under Row Level Security, and a secret
here would reach the browser the moment someone prefixed it with
`NEXT_PUBLIC_`.

### Deploying

Set the variables above in your host, then point Supabase at the domain —
**Authentication → URL Configuration** — or email confirmation and password
reset links will be rejected:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: `https://your-domain.com/**` and `http://localhost:3000/**`

Migrations are applied with `supabase db push`, not at deploy time.

### Applying the schema

The database is built entirely from the migrations in `supabase/migrations/`.

```bash
supabase link --project-ref <project-ref>   # prompts for the database password
supabase db push
```

For local development:

```bash
supabase start          # Postgres, Auth, PostgREST, Studio in Docker
supabase db reset       # rebuild from migrations
```

After any schema change, regenerate the types the app is compiled against:

```bash
supabase gen types typescript --linked > lib/db/database.types.ts
# or --local when working against the local stack
```

---

## How it's put together

```
app/
  page.tsx                 landing page
  auth/                    sign-up, sign-in, password reset, email confirm
  (app)/                   authenticated shell — sidebar + header
    dashboard/             summary cards, charts, recent activity
    transactions/          the unified ledger
    accounts/[accountId]/  per-account balance and activity
    categories/            two-level category tree
    settings/              profile and workspace
  actions/                 server actions (all mutations)
lib/
  db/queries.ts            every read, workspace-scoped
  db/types.ts              domain types over the generated schema
  money.ts                 exact decimal arithmetic
  workspace.ts             who is asking, and which workspace
  validation.ts            Zod schemas shared by client and server
  errors.ts                database errors → human sentences
supabase/
  migrations/              the schema, in order
  tests/                   SQL assertions (see below)
```

Server Components are the default. Client Components appear only where there is
real interactivity — forms, dialogs, charts, filter controls. Every mutation is
a Server Action that re-derives the workspace server-side and calls
`revalidatePath`.

---

## The parts worth understanding

### Money is never a float

Postgres stores every amount as `numeric(19,4)`. PostgREST would serialise that
as a JSON **number**, which means a JavaScript double — unacceptable in a
ledger. The views and RPCs therefore cast money to `text`, and `lib/money.ts`
parses those exact decimal strings into `bigint` minor units. Arithmetic happens
in integers; `Intl.NumberFormat` is only ever handed a value that has already
been rounded exactly.

The one place a JS number appears is `toChartNumber()`, used for bar heights.
Charts draw pixels, so the imprecision is irrelevant there — and every figure
the user actually *reads* is formatted from the string.

### One definition of a balance

```
initial_balance + income − expenses + transfers in − transfers out
```

That formula exists once, in the `account_balances` view. Nothing in the
application recomputes it, so no two screens can disagree.

### Transfers cannot go half-recorded

A transfer is one row in `transfers`. A trigger derives the two
`transfer_entries` rows in the same statement, so they are atomic by
construction — not by the client remembering to do both.

`transfer_entries` has a `SELECT` policy and **no** insert, update or delete
policy, and `authenticated` is granted only `SELECT`. Clients genuinely cannot
write them. A transfer's `signed_amount` is `0` in the ledger, so it can never
be counted as income or expense.

### The workspace is never taken on trust

The active workspace arrives as a cookie. `getSessionContext()` honours it only
if it matches a membership row the user can actually see, and otherwise falls
back to their first workspace. That check sits in front of RLS, not instead of
it — a forged workspace ID fails the server check *and* the policy.

### Security is in the database

Every table has RLS enabled. The rule throughout is "are you a member of the
workspace that owns this row?", answered by `SECURITY DEFINER` helpers in a
private schema (they exist to break the recursion of `workspace_members`
policies needing to read `workspace_members`). Writes additionally require a
non-`viewer` role. `anon` has no privileges on anything.

### Signing up is a database transaction

An `AFTER INSERT` trigger on `auth.users` creates the profile, a `Personal`
workspace, the owner membership and 25 default categories — in one transaction.
No onboarding code path can be skipped or half-completed.

### Deletion protects history

Accounts and categories that are referenced by transactions cannot be deleted:
the foreign keys are `ON DELETE RESTRICT`. The UI offers deactivation instead,
which hides them from pickers while leaving past records intact and labelled.
The delete option only appears when nothing depends on the row.

---

## Verification

Schema, balances and tenant isolation are covered by SQL assertions:

```bash
supabase db reset
PG=postgresql://postgres:postgres@127.0.0.1:54322/postgres
psql "$PG" -X -q -f supabase/tests/01_onboarding.sql
psql "$PG" -X -q -f supabase/tests/02_financial_matrix.sql
psql "$PG" -X -q -f supabase/tests/03_rls_isolation.sql
```

Every assertion raises on failure, so a clean run means everything passed. See
`supabase/tests/README.md` for what each script covers.

> These scripts insert test users. **Local databases only** — never run them
> against a database holding real data.

Application checks:

```bash
npm run lint
npm run build
```

The MVP is not complete while either fails.

---

## Conventions

- Strict TypeScript. `any` is not used; the one deliberate cast lives in
  `numericColumn()` and is documented where it sits.
- Reads go in `lib/db/queries.ts`, writes in `app/actions/`. Components don't
  query Supabase directly.
- Zod schemas in `lib/validation.ts` are imported by both the form and the
  Server Action, so client-side validation is a convenience and never the
  enforcement.
- Raw Postgres errors are mapped to plain language in `lib/errors.ts` and logged
  server-side. They are never rendered.
- Filters and pagination live in the URL, so views are shareable and survive a
  refresh. Filtering happens in the database, never in the browser.

---

## Not built (deliberately)

Budgets, goals, recurring transactions, receipt uploads, OCR, bank
integrations, CSV/Excel/PDF export, notifications, dark mode and social sign-in
are all out of scope. The schema and the membership model leave room for them;
none of them are stubbed out in the UI, because a control that leads nowhere is
worse than an absent one.

Multi-currency is modelled in the schema but constrained in the app: accounts
and transactions inherit the workspace currency, enforced by a database
trigger. With no FX rates, mixed-currency totals would be meaningless.
