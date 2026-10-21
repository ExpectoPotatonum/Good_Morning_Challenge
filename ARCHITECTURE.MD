# Wake-Up Challenge — Architecture and Product Specification

**Status:** Product behavior and implementation choices are confirmed. Begin implementation. Visual styling can be refined after the first working build.

**Challenge period:** 21 October 2026 through 31 October 2026 inclusive (11 challenge dates).

**Canonical timezone:** `Asia/Kuala_Lumpur` (UTC+08:00, same UTC+08:00 offset as Singapore). Use this timezone for official dates, scoring cutoffs, displayed timestamps, and the end-of-challenge transition. Never use the browser clock/timezone for official scoring.

## 1. Product scope and trade-offs

Build a small, casual wake-up challenge app for two friends. Participants select a username from a two-person picker; there is **no password, email verification, OTP, Supabase Auth session, or real identity verification**. Remember the selected username in local storage and allow switching participants.

This is intentionally a trust-based app, not a private or secure system. Anyone who can open the public URL can select either username and submit actions as either person. Do not describe username selection as authentication. The user accepts this trade-off.

Keep the implementation simple, but preserve the rules that make the game work correctly: calculate official timestamps and points on the server/database, enforce one record per participant per challenge date, prevent duplicate sleep-back penalties, and derive cumulative totals from records. Do not add passwords, RLS membership machinery, recursive-policy helpers, authentication, or a pgTAP privilege/security audit framework.

### In scope

- Exactly two configured participant usernames/display names.
- One daily check-in record per participant per challenge date.
- Server-captured check-in and sleep-back timestamps; server-side point calculation.
- Initial-report seed rows worth 1 point each for 21 October 2026.
- At most one confirmed sleep-back penalty per participant per date, subtracting 1 from cumulative score. Cumulative scores may be negative.
- Three UI stages, shared scoreboard/history/rules after check-in, randomized copy variants, and the supplied images already in the app repository.
- Netlify hosting and Supabase PostgreSQL.

### Out of scope

Passwords, identity verification, real authentication, user invitation/registration flows, more than two participants, multiple challenges, editing/deleting past records, alarms, wearable integration, automated proof of waking, and Supabase Realtime.

A check-in records when the database receives the request. It cannot prove the physical moment a person woke up. The server-received timestamp is the official check-in time and determines the wake-point award.

## 2. Technology stack and implementation conventions

| Layer | Choice | Responsibility |
|---|---|---|
| Frontend | React + Vite + TypeScript | Username chooser, stages, modals, scoreboard and history |
| Database | Supabase PostgreSQL | Challenge settings, two participants, daily records and scoring |
| Data operations | PostgreSQL RPC functions via `supabase-js` | Server clock, scoring, check-in, sleep-back and dashboard snapshot |
| Hosting | Netlify | Static deployment and continuous deployment |
| Tests | TypeScript/unit tests plus database integration tests | Scoring boundaries, date range, uniqueness, seed and penalty behavior |

Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the browser. Never expose a Supabase secret/service-role key or put it in any `VITE_*` variable. Use the publishable key only as the public project client key; it does not protect the app or identify a participant.

Recommended conventions:

- Keep all UI copy variants in `src/content/copy.ts`.
- Keep scoring pure helper tests independent of React where practical, but have PostgreSQL remain authoritative for persisted points.
- Read the existing repository to locate the supplied images and use their real paths. Do not ask the user to upload them again, replace them with unrelated assets, or rename them unless the current build genuinely requires it.
- Use accessible native `<dialog>` or an equivalent modal pattern, including focus handling, keyboard behavior, pending states and visible errors.
- Use a hash or modal for history rather than adding router complexity unless the repository already uses a router.

## 3. Confirmed scoring rules

Each participant starts at 0 points. On 21 October, each participant has already reported waking between 08:01 and 08:30; the initial-report seed gives each participant 1 point for that date.

### 3.1 Wake-point table

Score using the local wall-clock time converted from the **database-captured timestamp**. Seconds matter at each cutoff. The score counts when the server receives the tap, not when the user first intended to tap.

| Canonical local time | Wake points |
|---|---:|
| 00:00:00–06:30:59 | 5 |
| 06:31:00–07:00:59 | 4 |
| 07:01:00–07:30:59 | 3 |
| 07:31:00–08:00:59 | 2 |
| 08:01:00–08:30:59 | 1 |
| 08:31:00–23:59:59 | 0 |

Equivalent scorer:

```text
local_time < 06:31:00  -> 5
local_time < 07:01:00  -> 4
local_time < 07:31:00  -> 3
local_time < 08:01:00  -> 2
local_time < 08:31:00  -> 1
otherwise              -> 0
```

The 5-point cap applies to every earlier time, including before 06:01. Examples: `07:00:30` earns 4 points; `07:01:00` earns 3 points. A check-in at or after `08:31:00` receives 0 wake points and visible feedback such as `0 pts — late`.

### 3.2 Sleep-back penalty

- A participant who has a daily record may confirm that they went back to sleep.
- **At most one sleep-back penalty per participant per challenge date.** A successful confirmation subtracts exactly 1 point from cumulative score, even if that date's wake award was 0.
- Negative cumulative totals are allowed.
- Opening the modal or cancelling it has no scoring effect.
- The red confirm button is `Yea ig...`; the gray cancel button is `NAH JK i click for fun`.
- Disable the confirm button while the request is pending. Keep the modal open with a progress indicator until the server responds. On success, close the modal and move to Stage 3; on failure, keep it open and show the error.
- A repeated request must not deduct twice. Derive the score from stored rows rather than mutating a cumulative total.

```text
cumulative_points = SUM(daily_check_ins.wake_points)
                    - COUNT(daily_check_ins where sleep_back_at IS NOT NULL)

daily_net_points = wake_points
                   - (sleep_back_at IS NOT NULL ? 1 : 0)
```

Do not overwrite `wake_points` after a penalty; `sleep_back_at` records the penalty event.

## 4. Challenge date and clock semantics

- `starts_on = 2026-10-21`; `ends_on = 2026-10-31`; both dates are inclusive in `Asia/Kuala_Lumpur`.
- A single `get_dashboard(p_participant_key)` database RPC is the source of the challenge-local date, challenge status, both participants' rows and scores, and all 11 history dates.
- Capture the live timestamp once in the database function with `clock_timestamp()`. Convert it to `Asia/Kuala_Lumpur` for challenge date and scoring bucket.
- Do not accept client-supplied timestamps, challenge dates or points. The selected participant key is client-supplied and is **not identity-verified**; this is the agreed trust-based model.
- Day 1 seed rows mean both users already count as checked in on 21 October. Do not allow a second live check-in that date.
- Once the challenge-local date becomes 1 November 2026, show `Challenge over`, final cumulative totals and history. Hide check-in and sleep-back actions. Do not show a winner banner.
- In history, dates after the server challenge-local date display `—`. Past/current dates without a record display `Not checked in`.

## 5. Day 1 initial-report seed and launch order

The app is being initialized after both participants have already reported waking in the 08:01–08:30 band on 21 October. Represent it as a report, not an invented exact timestamp.

Seed exactly one row for each configured participant with:

- `challenge_date = DATE '2026-10-21'`
- `entry_source = 'day_one_seed'`
- `checked_in_at = NULL`
- `reported_wake_window = '08:01–08:30'`
- `wake_points = 1`
- `sleep_back_at = NULL`

Display it as `08:01–08:30`. Do not invent a check-in time. The sleep-back operation must find the row using participant key and challenge date even though `checked_in_at` is null.

Implementation/launch order:

1. Apply version-controlled SQL migrations.
2. Configure the two fixed participant keys and display names in the participants table/seed configuration. The configured participants are `player_1` / `Jet` and `player_2` / `Bingsu` (see `supabase/migrations/20261021000008_participant_names.sql`); the keys are internal identifiers and the display names are what the app shows.
3. Seed/verify both 21 October initial-report rows. The seed script must be idempotent or fail clearly without overwriting an existing row.
4. Verify the dashboard shows 1 point each and the initial-report label.
5. Build and deploy to Netlify, then share the URL.

Because the username picker is not authentication, the public URL is sufficient to choose either participant. There are no credentials to distribute.

## 6. Database model and client data flow

Use simple version-controlled migrations. The following logical schema can be implemented with equivalent names if all behavior is preserved.

### `challenges`

- `id` UUID primary key
- `name` text, default `Wake-Up Challenge`
- `starts_on` date, `2026-10-21`
- `ends_on` date, `2026-10-31`
- `timezone` text, `Asia/Kuala_Lumpur`
- `created_at` timestamptz

### `challenge_members` (the two selectable usernames)

- `participant_key` text primary key, e.g. `player_1`, `player_2`
- `challenge_id` UUID foreign key
- `display_name` text shown in the app
- `sort_order` smallint for stable scoreboard order
- `created_at` timestamptz

Seed exactly two records. These values are public labels, not secrets. The UI can remember the selected key in local storage and provide a `Switch player` control. Do not describe this as login/authentication.

### `daily_check_ins`

One record per participant and challenge date:

- `id` UUID primary key
- `challenge_id` UUID foreign key
- `participant_key` text foreign key to `challenge_members.participant_key`
- `challenge_date` date in the canonical challenge timezone
- `entry_source` text/enum: `live` or `day_one_seed`
- `checked_in_at` timestamptz nullable (null for the seed; exact server timestamp for live rows)
- `reported_wake_window` text nullable (`08:01–08:30` for the seed only)
- `wake_points` smallint, constrained to 0–5
- `sleep_back_at` timestamptz nullable
- `created_at` timestamptz

Constraints:

- Unique `(challenge_id, participant_key, challenge_date)`.
- `wake_points BETWEEN 0 AND 5`.
- A `live` row requires `checked_in_at IS NOT NULL` and `reported_wake_window IS NULL`.
- A `day_one_seed` row must be on 2026-10-21 with null `checked_in_at`, `reported_wake_window = '08:01–08:30'`, and `wake_points = 1`.
- Use database constraints and atomic SQL operations to preserve one record and at most one penalty, even though this is not an authenticated/private application.

### Client data flow

Call the RPCs via `supabase-js`; do not independently calculate or persist official scoring on the client. The app should not make direct table reads/writes from browser components. Use these RPCs:

- `get_dashboard(p_participant_key text)` — returns the server time/date, stage-relevant current-user record, both participants' current-day records and totals, all 11 history dates, rules data if stored, and challenge status.
- `check_in_today(p_participant_key text)` — uses the server clock, validates the challenge date, scores, inserts exactly one daily record and returns the persisted timestamp/points/result code.
- `mark_sleep_back_today(p_participant_key text)` — finds the selected participant's row for today's challenge date and atomically marks `sleep_back_at` only if null.

For the simple unauthenticated Supabase setup, expose only the three intended RPCs to the public `anon` role and leave direct table access unavailable. This is a minimal data-access boundary, not identity-based security. Explicitly revoke direct table privileges from `anon` and `authenticated`; revoke default function execution from `PUBLIC`; and grant `EXECUTE` on `get_dashboard(text)`, `check_in_today(text)` and `mark_sleep_back_today(text)` to `anon`. Ensure the API-exposed `public` schema is usable by `anon` as required. Do not create RLS policies. Implement these three exposed RPCs as `SECURITY DEFINER` functions owned by the migration/database owner, with `SET search_path = ''` and fully schema-qualified object names, because the functions need to read/write tables that the browser roles cannot access directly. The public RPC functions accept either known participant key, so anyone can call an action as either person. No service-role key is to be used in the browser. This function setup preserves ordinary scoring/duplicate behavior but does not verify identity or prevent impersonation.

A public Supabase publishable key is expected to be in browser code; it is not a secret. Never place a secret/service-role key in the frontend or any `VITE_*` variable.

## 7. RPC behavior and stable result codes

### `get_dashboard(p_participant_key text)`

Return a consistent snapshot including:

- `server_now` and `server_challenge_date` in `Asia/Kuala_Lumpur`;
- challenge status: `before`, `active`, or `over`;
- the currently selected participant key/name;
- both participants' names, today's row/report window, wake award, sleep-back timestamp and daily net;
- cumulative totals for both people;
- all 11 history dates for both people, including absent records and a distinction between future dates and past/current missing entries.

Reject an unknown participant key with `UNKNOWN_PARTICIPANT`. The key is only a selector and does not prove who is using the app.

### `check_in_today(p_participant_key text)`

- Accept only the configured two participant keys.
- The public wrapper captures one `v_now := clock_timestamp()` and passes that exact value to a private/internal helper, e.g. `private.check_in_at(p_participant_key text, p_now timestamptz)`. The helper is the deterministic test seam; keep it out of the PostgREST-exposed schemas and do not grant execution to `anon`.
- Use the same captured value for challenge date, points and `checked_in_at`.
- Reject dates outside the challenge window; the seed rows already occupy 21 October.
- Calculate the award in SQL using the table in §3. Public clients cannot provide points or a time.
- Insert the record atomically; let the unique constraint prevent duplicate check-ins and map a duplicate to `ALREADY_CHECKED_IN`.
- Return the saved timestamp, local challenge date, wake points, daily net and result code.

### `mark_sleep_back_today(p_participant_key text)`

- Accept only the configured two participant keys.
- Find today's row using `(participant_key, challenge_date)`; do not require `checked_in_at IS NOT NULL`, so the 21 October seed row can be penalized.
- Atomically set `sleep_back_at` if it is null, using a database-generated timestamp.
- A repeated attempt returns `SLEEP_BACK_ALREADY_MARKED` and must not deduct again.
- Return one of the stable codes below as appropriate.

### Client handling of result/error codes

| Code | Client behavior |
|---|---|
| `ALREADY_CHECKED_IN` | Refetch dashboard and render the persisted stage, not a generic error. |
| `SLEEP_BACK_ALREADY_MARKED` | Refetch dashboard and render Stage 3. |
| `NO_CHECK_IN_TODAY` | Refetch dashboard; no penalty is applied. |
| `CHALLENGE_NOT_ACTIVE` | Refetch and display before-start/over state. |
| `UNKNOWN_PARTICIPANT` | Return to username chooser and show a clear message. |
| `DATABASE_ERROR` | Keep current modal/stage stable and show a recoverable error. |

Disable each submitting button while a request is pending. On double-click or a stale second device, refetch instead of applying optimistic score changes. Refresh the dashboard after successful writes and when the page regains focus. Supabase Realtime is unnecessary.

## 8. UI state and exact content requirements

Use the selected username plus `get_dashboard()` to derive the stage. Persisted database state is authoritative after reload or opening another device; the remembered local-storage selection only chooses which participant to display/actions to send as.

### Username chooser

On first load, choose one of the two preconfigured participant display names. Remember the selected `participant_key` in local storage. Provide a simple `Switch player` action so the other participant can select themselves on a shared device. Do not ask for a password, email, OTP or verification. This is a selector, not an authentication screen. After selection, follow the stage determined by the saved daily row.

### Stage 1 — not yet checked in today

Show only the check-in experience: do **not** show the scoreboard, rules or history before today's check-in.

- Small helper text: `click below to check in for the day`.
- Large, round, red primary button with one randomly selected title per Stage 1 entry/reload, not per React render:
  - `GOOD MOANING`
  - `GOOD MEOWING`
  - `GOOD MORNING`
  - `good morning`
  - `早上好中国，现在我有冰淇淋，我很喜欢冰淇淋`
  - An image-backed variant using the existing `早安图.png` image from the repo.
- Make the long Chinese string fit using responsive typography (for example `clamp()` and `text-wrap: balance`). If the image fails to load, show readable text fallback and keep the action operable.
- The main button invokes `check_in_today()`.
- At the bottom show `Not having a good morning? Click me`.
- Clicking it opens a modal with the existing `meowmeow.png` image and the exact text `:ur blessed by meowmeow, now GOOD MORNING to you` plus a `yay` button.
- **The `yay` button performs the exact same check-in action as the main button.** It awards points and records the timestamp, not merely closes the modal. Keep the modal open while the request is pending; disable repeat submissions. On success, display the points just earned (including `0 pts — late`), close the modal, and transition to Stage 2. On error, keep the modal open and display the error inside it.

### Stage 2 — Stage 3 shared content plus current-user check-in status and sleep-back prompt

Show the shared scoreboard, rules access, and history access, plus the current selected participant's check-in/status panel and sleep-back prompt.

The screen order is fixed:

1. `Scoreboard` heading.
2. The selected participant's three status lines: `You checked in today at: {timestamp}`, `wake points: {n} pt`, `total score: {n} pt`.
3. One two-line block per participant: `{name} total pts: {cumulative}` and `Today: {timestamp or reported window} ({n} wake points)`. Append `· slept back` when that participant has a confirmed penalty.
4. The action buttons, each on its own line: `(did u slp back?)`, `(rules)`, `(view history)`.

- Show `You checked in today at: {timestamp}` for live check-ins; include seconds and make the timezone clear (e.g. `UTC+8`).
- For the seeded row show exactly `You checked in today at: 08:01–08:30`, with no invented timestamp.
- Show the `(did u slp back?)` button.
- Clicking it opens a modal with one randomly selected title per modal opening (not on every render):
  - `Oh no reallyyyy?`
  - `oh no reallyyy?`
  - `oh SHIT...`
  - `NAURRRRRR`
  - `oooops`
  - `BRUV`
  - `hehe ur losing 1 pt`
  - `not this time...`
  - `TOO TIRED SIA`
  - `CMI`
  - `today rly tired sia`
- Modal buttons:
  - Red `Yea ig...`: call `mark_sleep_back_today()`.
  - Gray `NAH JK i click for fun`: close/cancel without making a write request; remain in Stage 2.
- On confirm, keep the modal open with progress state while pending. Close only after server success. On failure, keep it open and show the error. Never subtract points optimistically.
- After a confirmed penalty is saved, transition to Stage 3. The Stage 2 personal status panel and sleep-back prompt disappear; the shared scoreboard still shows both participants' today record/time as specified below.

### Rules and history content (visible from Stage 2 onward)

Provide a `(rules)` control that opens a modal or panel containing:

- Challenge dates: 21–31 October 2026 inclusive; official timezone `UTC+8` (the challenge runs on `Asia/Kuala_Lumpur`, a fixed UTC+08:00 offset with no daylight saving).
- The full wake-point table from §3, including exact second boundaries and the 5-point cap.
- The server receives the official check-in time; points are based on that received timestamp.
- Late check-in (08:31:00 or later) earns 0 wake points.
- A confirmed sleep-back subtracts 1 from cumulative points, at most once per participant/date; scores may be negative.
- The 21 October starting entries are initial reports for 08:01–08:30 and do not have exact timestamps.

### Stage 3 — scoreboard/history after sleep-back is confirmed

- Show both participants' cumulative points and each participant's check-in time/reported window for today.
- Keep the rules control reachable.
- Show `(view history)` beneath the scoreboard. Open a modal or use `#history`; render 11 date rows with both participants' time/report, base wake points, sleep-back status and daily net points.
- For a missing past/current record, show `Not checked in`. For future dates, show `—`.
- Stage 3 hides the Stage 2 personal status/prompt panel; it does not hide the two-person scoreboard or today's per-person wake-time display.

### Challenge-over state

When the server challenge-local date is after 31 October 2026, show `Challenge over`, final cumulative totals and history/rules. Hide check-in and sleep-back actions. No winner banner or tie-breaker. No action may modify the ended challenge.

### Shared UI behavior

- Use a `Switch player` control instead of sign-out.
- Keep button/modal copy in `src/content/copy.ts`; random selections stay stable for one stage entry or one modal opening.
- Use accessible dialogs, distinct confirm/cancel styles, disable buttons during requests, preserve modal state on failure, and show recoverable errors.
- Use the existing images already in the app repository. Inspect the repository for their current names and paths; do not ask the user for them or substitute unrelated pictures.
- Visual styling details are intentionally left for the user's UI review; implement the specified hierarchy, buttons and stages first.

## 9. Testing and acceptance criteria

Use pure unit tests for scoring and copy selection plus database integration tests for persisted behavior. Do not build a separate authentication/RLS/privilege audit suite; this app intentionally has no authentication/RLS access-control model.

### Scoring boundaries

Test at least these local times:

- `00:00:00` and `06:30:59` -> 5.
- `06:31:00` and `07:00:59` -> 4.
- `07:01:00` and `07:30:59` -> 3.
- `07:31:00` and `08:00:59` -> 2.
- `08:01:00` and `08:30:59` -> 1.
- `08:31:00` and `23:59:59` -> 0.
- `07:00:30` -> 4 and `07:01:00` -> 3.

### Database integration checks

- Reject 20 October 2026 23:59:59 local; accept an eligible instant on 31 October 2026 23:59:59 local; reject 1 November 2026 00:00:00 local. Use an internal testable time-argument helper so tests do not depend on the real clock; public clients must not provide a time.
- The seed procedure produces exactly one 21 October initial-report row per participant, each with 1 point and no fabricated timestamp; rerunning does not overwrite/duplicate rows.
- Both initial-report rows can receive a sleep-back penalty on 21 October despite null `checked_in_at`.
- One check-in per participant/date; repeated requests return `ALREADY_CHECKED_IN` without a second row.
- One sleep-back penalty per participant/date; repeated requests return `SLEEP_BACK_ALREADY_MARKED` without changing the original timestamp or applying another deduction.
- A 0-point wake award followed by sleep-back has daily net -1; cumulative totals may be negative.
- Database clock is used for timestamps/official date, independent of the browser timezone or supplied browser clock.
- `get_dashboard()` always returns both participants, both totals, and all 11 dates; future days show `—`.

### UI tests

- Before today's check-in, show Stage 1 only; hide scoreboard, rules and history.
- Main red button and `yay` call the same check-in operation and have the same scoring/timestamp semantics.
- `yay` modal stays open while pending; error leaves it open; successful check-in shows award and advances to Stage 2.
- Stage 2 contains shared scoreboard/rules/history access plus the selected participant's check-in status and sleep-back prompt.
- Sleep-back cancel produces no write; confirm produces one penalty after server success and transitions to Stage 3; error leaves modal open and points unchanged in the UI until refetch.
- Score feedback includes `0 pts — late`; live timestamps include seconds and timezone; the seed displays the initial-report window only.
- Copy variants do not rerandomize on every render.
- History shows exactly 11 dates and both participants, with correct missing/future labels and sleep-back/daily-net data.
- After challenge end, actions disappear and final totals/history remain visible without a winner banner.
- The participant picker and `Switch player` work; remember the selection across reloads. Remember that switching names changes only the selected public identity, not secure authorization.
- Image failure has a readable fallback.

### Build acceptance

- `npm run build` succeeds.
- TypeScript/lint checks pass where configured.
- Migrations apply to a clean Supabase project.
- Scoring, date, seed, duplicate and penalty tests pass.
- Netlify build command is `npm run build`; publish directory is `dist`.

## 10. Deployment and setup

- Pin the Node version using `.nvmrc` and match it in Netlify.
- Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in local and Netlify environment variables.
- Keep `.env.local` out of version control; commit a blank `.env.example`.
- Never put a secret/service-role key in the frontend.
- The browser uses the public publishable key and the no-auth public RPCs; do not create Supabase Auth users, passwords, OTP flows, RLS policies, membership-recursion helpers, or auth provisioning scripts.
- Use minimal SQL grants needed for the chosen RPCs to work with Supabase's Data API. Make the three intended public RPC calls usable by the `anon` role. Avoid granting direct browser table writes; these grants are for correct app wiring, not identity-based security.
- If Netlify flags the publishable key, verify it is the public key before safelisting that exact value using `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES`. Never safelist a secret key or disable scanning as a workaround.
- For a Vite single-page app using only modal/hash-based history, a rewrite is not needed unless path-based client routing is added.

## 11. Implementation sequence

1. Inspect the existing repository before changing files. Retain existing image assets and build conventions where reasonable.
2. Add/update SQL migrations for the simple participants/challenge/check-ins schema, necessary constraints, and the three RPCs.
3. Add unit tests for the pure scorer and database integration tests for time boundaries, seeding, duplicate check-ins, and one penalty per day.
4. Configure the two public participant names/keys, then seed 21 October with 1 point each.
5. Implement the single `get_dashboard()` data flow and username chooser/local storage.
6. Implement Stage 1, the `yay` check-in action, Stage 2 shared content + prompt, Stage 3 after penalty, and the challenge-over view.
7. Put exact text/random variants in `src/content/copy.ts`; use the existing image files in the repo.
8. Run checks and `npm run build`; document database setup and deployment in `README.md`.
9. Deploy using Netlify (`npm run build`, `dist`) only after verifying the initial dashboard is 1 point each.

## 12. Confirmed decisions and known trade-off

- Stage 1 contains only the check-in experience, not the scoreboard, rules or history.
- The `yay` button performs the same check-in as the primary button.
- Stage 2 equals Stage 3 shared content plus the current participant's status/sleep-back prompt; confirming a penalty transitions to Stage 3.
- Username-only participant selection, with no password or verification, is explicitly chosen. Anyone with the URL can select either participant and impersonate them. This app is suitable only for a trusted casual challenge.
- One sleep-back penalty maximum per participant/day; cumulative totals may be negative.
- The images are already in the application repository; the coding agent must inspect and use them.
- Visual styling can be refined after the first functional build.
