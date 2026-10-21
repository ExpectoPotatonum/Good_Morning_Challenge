# Database integration tests

These tests talk directly to PostgreSQL so they can pin "now" instead of
depending on the real clock. They are **skipped** unless
`SUPABASE_TEST_DB_URL` is set.

## Requirements

- A **dedicated test database** with the versioned migrations applied. Do
  **not** point this at the live challenge project: the tests insert and roll
  back rows in `daily_check_ins`.
- A direct PostgreSQL connection string (not the Data API URL):

  ```bash
  SUPABASE_TEST_DB_URL="postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres"
  ```

  Supabase Dashboard → Project Settings → Database → Connection string.
  Use the **session** (direct) connection string, port 5432, not the pooler.

## Running

```bash
SUPABASE_TEST_DB_URL="postgresql://..." npm test
```

The suite applies every file in `supabase/migrations/` before running, so it
also verifies that the migrations apply cleanly.

## What is covered

- Challenge window: rejects 20 Oct 23:59:59 and 1 Nov 00:00:00 local,
  accepts 31 Oct 23:59:59 local.
- Server-side scoring at every exact second boundary.
- One check-in per participant/date (`ALREADY_CHECKED_IN`, no second row).
- Day-one seed: one initial-report row per participant, 1 point, null
  timestamp, idempotent on rerun.
- Sleep-back on the seed row despite its null `checked_in_at`.
- One penalty per participant/date (`SLEEP_BACK_ALREADY_MARKED`, original
  timestamp untouched).
- 0-point award + penalty gives a daily net of -1 and negative cumulative
  totals are allowed.
- `get_dashboard()` returns both participants, both totals and all 11 dates.
- `anon` can execute exactly the three intended public RPCs.
