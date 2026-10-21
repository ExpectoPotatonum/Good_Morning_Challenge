# Wake-Up Challenge

A small, trust-based wake-up challenge app for two people, 21–31 October 2026.
Each participant picks a public username (no password, no verification), taps a
button once per day, and the **database** decides the wake points from the
timestamp it received.

Official timezone: `Asia/Kuala_Lumpur` (UTC+08:00).

> The username picker is a selector, not authentication. Anyone with the URL can
> act as either participant. That is an accepted trade-off for a casual
> challenge between friends.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Database | Supabase PostgreSQL (3 RPCs, no RLS, no Auth) |
| Hosting | Netlify (static) |
| Tests | Vitest (unit + UI) and Vitest + `pg` (database integration) |

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the two values below
npm run dev                  # http://localhost:5173
```

`.env.local`:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use the **publishable** key only. Never put a secret / service-role key in the
frontend or in any `VITE_*` variable.

## Supabase setup

### Hosted project

Apply the migrations in `supabase/migrations/` **in filename order** via the
Supabase Dashboard → SQL Editor, or with the CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

| File | Purpose |
|---|---|
| `20261021000000_init_schema.sql` | `challenges`, `challenge_members`, `daily_check_ins`, constraints, and the internal `private` schema |
| `20261021000001_seed_data.sql` | the challenge row, the two participants, and the 21 October initial-report rows |
| `20261021000002_rpc_get_dashboard.sql` | `get_dashboard(text)` |
| `20261021000003_rpc_check_in.sql` | `check_in_today(text)` + private helper `private.private_check_in_at(text, timestamptz)` |
| `20261021000004_rpc_sleep_back.sql` | `mark_sleep_back_today(text)` + private helper `private.private_mark_sleep_back_at(text, timestamptz)` |
| `20261021000005_grants.sql` | table/function privileges: only the three RPCs are executable by `anon` |
| `20261021000006_private_schema.sql` | idempotent safety net for the `private` schema |

> **Ordering matters.** `private` is created in the *first* migration because
> the RPC migrations define functions inside it. If you previously applied the
> migrations while `private` was only created last, `20261021000003` and
> `20261021000005` failed with `schema "private" does not exist`. Fix it by
> re-running, in this order:
>
> 1. `20261021000006_private_schema.sql` (creates the schema)
> 2. `20261021000003_rpc_check_in.sql`
> 3. `20261021000004_rpc_sleep_back.sql`
> 4. `20261021000005_grants.sql`
>
> All four are idempotent, so re-running them does not duplicate data.

### Pending migration on the live project

`20261021000007_fix_dashboard_history.sql` rebuilds `get_dashboard()` so the
history contains one entry per challenge date (11 entries) instead of one
entry per participant. Apply it with `supabase db push`, or paste the file
into the Dashboard → SQL Editor. `CREATE OR REPLACE` makes it safe to re-run.

### Local Supabase (optional)

```bash
npm install -g supabase
supabase start          # prints the local API URL + keys
supabase db reset       # applies every migration and seeds 21 October
```

Copy the local `API URL` and `anon`/`publishable` key into `.env.local`.

### Verify the database

```sql
-- both participants exist, both seeded with 1 point and no invented timestamp
select participant_key, challenge_date, entry_source, checked_in_at,
       reported_wake_window, wake_points
  from public.daily_check_ins
 order by participant_key, challenge_date;

-- anon may execute exactly the three public RPCs
select n.nspname, p.proname, has_function_privilege('anon', p.oid, 'execute') as anon_can_execute
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where p.proname in ('get_dashboard','check_in_today','mark_sleep_back_today',
                     'private_check_in_at','private_mark_sleep_back_at')
 order by n.nspname, p.proname;

-- smoke test: both players on 1 point
select public.get_dashboard('player_1');
```

Expected: two `day_one_seed` rows for `2026-10-21` with `wake_points = 1`,
`checked_in_at IS NULL`, `reported_wake_window = '08:01–08:30'`; `anon` may
execute the three public RPCs and **not** the two `private` helpers.

## Scoring

| Local time (Asia/Kuala_Lumpur) | Wake points |
|---|---:|
| 00:00:00–06:30:59 | 5 |
| 06:31:00–07:00:59 | 4 |
| 07:01:00–07:30:59 | 3 |
| 07:31:00–08:00:59 | 2 |
| 08:01:00–08:30:59 | 1 |
| 08:31:00–23:59:59 | 0 |

- Points come from the timestamp the **database** received, never the browser.
- One record per participant per day; a second check-in returns
  `ALREADY_CHECKED_IN`.
- One sleep-back penalty per participant per day; each penalty subtracts 1 from
  the cumulative score. Cumulative totals may be negative.
- The 21 October rows are *initial reports* for 08:01–08:30 and have no exact
  timestamp. They can still receive a sleep-back penalty.

## Testing

```bash
npm test          # unit + UI tests
npm run lint      # oxlint
npm run build     # tsc -b && vite build
```

| Suite | What it covers |
|---|---|
| `tests/scoring.test.ts` | scorer boundaries |
| `tests/copy.test.ts` | copy strings, variants, timezone formatting |
| `tests/ui.test.tsx` | stage 1/2/3, modals, pending/error states, challenge over |
| `tests/live.test.tsx` | renders the real app against the real database (read-only) |
| `tests/db/integration.test.ts` | database behaviour (skipped unless `SUPABASE_TEST_DB_URL` is set) |

`tests/live.test.tsx` runs automatically when `.env.local` points at a Supabase
project, and is skipped otherwise. It only calls `get_dashboard()` — it never
checks in and never applies a penalty.

Verify the live project without the test runner:

```bash
npm run verify:db
```

Database integration tests need a **dedicated** test database — they insert
rows and roll them back, so never point them at the live challenge project:

```bash
SUPABASE_TEST_DB_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" npm test
```

See `tests/db/README.md` for details.

## Deployment (Netlify)

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Node version: the one in `.nvmrc`

No rewrite is needed: the app uses modals, not path-based routing. If Netlify
flags the publishable key as a secret, safelist that exact value with
`SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` — never safelist a secret key or
disable scanning.

## Layout

```
src/
  components/     Stage1 / Stage2 / Stage3, Modal, Scoreboard, rules + history modals
  content/copy.ts every UI string and random variant
  utils/          scoring helpers, challenge-local time formatting
supabase/
  migrations/     schema, seed, the three RPCs, grants
tests/            unit, UI and database integration tests
ARCHITECTURE.MD   canonical product specification
```
