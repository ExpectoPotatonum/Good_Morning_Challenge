# Wake-Up Challenge — Setup

## Local development
1. Install dependencies: `npm install`
2. Copy env: `cp .env.example .env.local` (or create it) and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Run dev server: `npm run dev`

## Supabase
Apply migrations in order under `supabase/migrations/`. 
The schema defines:
- `challenges`, `challenge_members` (exactly 2), `daily_check_ins`
- RPCs: `get_dashboard(text)`, `check_in_today(text)`, `mark_sleep_back_today(text)` (SECURITY DEFINER, no RLS policies)
- Seed: two players + initial report rows for 2026-10-21 (08:01–08:30, 1pt each, `day_one_seed`, null `checked_in_at`)

Grant `EXECUTE` on those three RPCs to `anon`/`authenticated`. Revoke direct table access from browser roles. Do **not** use service role key in frontend.

## Testing
- Unit tests: `npm test` (scoring + copy)
- DB integration tests: run against a test DB with migrations+seed applied (see `tests/db/README.md`)

## Build
`npm run build` (outputs `dist/`)

## Deployment (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Node version per `.nvmrc`
