/**
 * Verifies the live Supabase project without writing anything.
 *
 *   node scripts/verify-db.mjs
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env.local
 * (or from the environment) and checks:
 *   - get_dashboard() returns both participants with 1 point each
 *   - the 21 October rows are initial reports (1 pt, no exact timestamp)
 *   - the history has all 11 challenge dates
 *   - check_in_today() reports ALREADY_CHECKED_IN (21 Oct is occupied by the
 *     seed row, so this is a read-only check)
 *
 * It never inserts, updates or deletes anything.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  for (const file of ['.env.local', '.env']) {
    const full = path.join(root, file);
    if (!existsSync(full)) continue;
    for (const line of readFileSync(full, 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
      if (match && !env[match[1]]) {
        env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (see .env.local).');
  process.exit(1);
}

if (/(secret|service_role)/i.test(key)) {
  console.error('That looks like a secret key. The browser must only use the publishable key.');
  process.exit(1);
}

async function rpc(name, params) {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${name} -> HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  return body;
}

const problems = [];
const check = (ok, message) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${message}`);
  if (!ok) problems.push(message);
};

try {
  const dash = await rpc('get_dashboard', { p_participant_key: 'player_1' });

  if (dash.error) {
    check(false, `get_dashboard returned ${dash.error}`);
  } else {
    check(true, `get_dashboard() responded (server date ${dash.server_challenge_date})`);

    const players = dash.participants ?? [];
    check(players.length === 2, `both participants returned (got ${players.length})`);

    for (const p of players) {
      check(
        p.cumulative_points === 1,
        `${p.display_name}: cumulative_points = ${p.cumulative_points} (expected 1)`,
      );
      const today = p.today ?? {};
      check(today.has_record === true, `${p.display_name}: has a record for today`);
      check(
        today.entry_source === 'day_one_seed',
        `${p.display_name}: entry_source = ${today.entry_source} (expected day_one_seed)`,
      );
      check(
        today.checked_in_at === null,
        `${p.display_name}: checked_in_at is null (no invented timestamp)`,
      );
      check(
        today.reported_wake_window === '08:01–08:30',
        `${p.display_name}: reported window = "${today.reported_wake_window}"`,
      );
      check(today.wake_points === 1, `${p.display_name}: wake_points = ${today.wake_points} (expected 1)`);
    }

    const history = dash.history ?? [];
    check(history.length === 11, `history has 11 dates (got ${history.length})`);
    check(history[0]?.date === '2026-10-21', `history starts 2026-10-21 (got ${history[0]?.date})`);
    check(history[10]?.date === '2026-10-31', `history ends 2026-10-31 (got ${history[10]?.date})`);
    check(
      (history[0]?.rows ?? []).every((r) => r.record?.entry_source === 'day_one_seed'),
      '21 October rows are the initial reports',
    );

    const unknown = await rpc('get_dashboard', { p_participant_key: 'not_a_player' });
    check(unknown.error === 'UNKNOWN_PARTICIPANT', `unknown key -> ${unknown.error}`);
  }

  const checkIn = await rpc('check_in_today', { p_participant_key: 'player_1' });
  check(
    checkIn.code === 'ALREADY_CHECKED_IN',
    `check_in_today() -> ${checkIn.code} (21 Oct is taken by the seed row, so nothing was written)`,
  );
} catch (error) {
  check(false, error.message);
}

console.log('');
if (problems.length) {
  console.log(`${problems.length} problem(s) found.`);
  process.exit(1);
}
console.log('All checks passed. The database is ready for the UI.');
