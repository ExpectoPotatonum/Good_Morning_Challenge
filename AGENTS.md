# Agent Instructions — Wake-Up Challenge

`ARCHITECTURE.MD` is the canonical source of truth for all product behavior, scoring, schema, RPCs, UI copy, tests, and deployment. Read it before coding. This project is intentionally a simple, trust-based app with a username chooser and no password or verification.

## Workflow

1. Inspect the existing repository and retain its conventions and image assets. Do not ask the user to upload the images; find and use the files already present.
2. Implement the Supabase SQL schema/RPCs and seed data first. Do not add Supabase Auth, passwords, OTP, RLS policies, membership helpers, or an authentication/privilege audit framework.
3. Keep official timestamps, scoring and daily uniqueness in PostgreSQL. The browser must not submit its own timestamp/date/points or calculate persisted official scores.
4. Keep the two participants selectable by public username. Remember the selected participant key in local storage and provide a simple `Switch player` action. This is not authentication; either username can be impersonated by anyone with the URL.
5. Seed both 21 October 2026 initial-report rows at 1 point each before testing the UI. Preserve null exact timestamp and display `08:01–08:30`.
6. Implement `get_dashboard()`, `check_in_today()` and `mark_sleep_back_today()` as described in `ARCHITECTURE.MD`. Use stable error codes and refresh persisted dashboard state after writes/conflicts.
7. Put all UI strings and randomized variants in `src/content/copy.ts`. The main `GOOD MOANING` button and modal `yay` must invoke the same check-in action.
8. Implement stages exactly: Stage 1 is check-in experience only; Stage 2 is shared scoreboard/rules/history plus own status and sleep-back prompt; Stage 3 follows a successful penalty and hides the personal status/prompt but retains the shared scoreboard.
9. Keep modals open during pending writes, disable duplicate submissions, update points only after server success, and show failures within the modal.
10. Run scorer unit tests, database integration tests, TypeScript/lint checks where configured, and `npm run build`. Document local Supabase and Netlify setup in `README.md`.

## Non-negotiable rules

- Challenge dates: 21–31 October 2026 inclusive; timezone: `Asia/Kuala_Lumpur` (UTC+08:00).
- Wake points: before 06:31 = 5; 06:31–07:00 = 4; 07:01–07:30 = 3; 07:31–08:00 = 2; 08:01–08:30 = 1; 08:31 onward = 0. Apply the exact second boundaries in `ARCHITECTURE.MD`.
- On 21 October, both participants start with a seeded 1 point and a reported time window, not an exact timestamp.
- One daily record per participant/day; one sleep-back penalty per participant/day; each penalty is -1 to cumulative score. Negative totals are valid.
- Use the database-received timestamp to calculate points; do not trust the browser clock.
- Challenge end hides write actions and shows final totals/history, with no winner banner.
- Use `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_URL`; never put a secret/service-role key in browser code.
- Do not add authentication or claim username selection is secure. The user explicitly accepts that anyone with the URL can act as either participant.
- Do not finalize additional visual styling before the user reviews the functional UI.
