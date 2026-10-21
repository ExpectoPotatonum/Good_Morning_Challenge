/**
 * In-memory stand-in for the three Postgres RPCs, used by demo mode only.
 *
 * Mirrors the behaviour of
 *   supabase/migrations/20261021000002_rpc_get_dashboard.sql
 *   supabase/migrations/20261021000003_rpc_check_in.sql
 *   supabase/migrations/20261021000004_rpc_sleep_back.sql
 * closely enough to drive every UI stage: same response shapes, same stable
 * codes, same scoring boundaries and the same 21 October seed rows.
 *
 * State lives in module memory, so a page reload resets the demo day.
 */

import { DEMO_DATE, DEMO_TIME } from './demo-config';

export type DemoRpcResult = { data: unknown; error: { message: string } | null };

const STARTS_ON = '2026-10-21';
const ENDS_ON = '2026-10-31';
const TIMEZONE = 'Asia/Kuala_Lumpur';
const OFFSET = '+08:00';
const DAY_ONE_WINDOW = '08:01–08:30';

type Member = { participant_key: string; display_name: string };

/** Same order as `challenge_members.sort_order`. */
const MEMBERS: readonly Member[] = [
  { participant_key: 'player_1', display_name: 'Jet' },
  { participant_key: 'player_2', display_name: 'Bingsu' },
];

type Row = {
  participant_key: string;
  date: string;
  entry_source: 'live' | 'day_one_seed';
  checked_in_at: string | null;
  reported_wake_window: string | null;
  wake_points: number;
  sleep_back_at: string | null;
};

const rows = new Map<string, Row>();

// The 21 October initial reports, identical to the seed migration.
for (const member of MEMBERS) {
  rows.set(`${STARTS_ON}|${member.participant_key}`, {
    participant_key: member.participant_key,
    date: STARTS_ON,
    entry_source: 'day_one_seed',
    checked_in_at: null,
    reported_wake_window: DAY_ONE_WINDOW,
    wake_points: 1,
    sleep_back_at: null,
  });
}

let clockTick = 0;

const pad = (value: number) => String(value).padStart(2, '0');

/** Stable "server now" for dashboard reads. */
function serverNow(): string {
  return `${DEMO_DATE}T${DEMO_TIME}:00${OFFSET}`;
}

/** Distinct timestamps per write, so history rows do not collide. */
function writeTimestamp(): string {
  const [hour, minute] = DEMO_TIME.split(':').map(Number);
  const second = clockTick++ % 60;
  return `${DEMO_DATE}T${pad(hour)}:${pad(minute)}:${pad(second)}${OFFSET}`;
}

/** Exact scoring boundaries from ARCHITECTURE.MD §3. */
function wakePointsAt(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  const minutes = hour * 60 + minute;
  if (minutes < 6 * 60 + 31) return 5;
  if (minutes < 7 * 60 + 1) return 4;
  if (minutes < 7 * 60 + 31) return 3;
  if (minutes < 8 * 60 + 1) return 2;
  if (minutes < 8 * 60 + 31) return 1;
  return 0;
}

const dailyNet = (row: Row) => row.wake_points - (row.sleep_back_at ? 1 : 0);

function cumulativeFor(participantKey: string): number {
  let total = 0;
  for (const row of rows.values()) {
    if (row.participant_key === participantKey) total += dailyNet(row);
  }
  return total;
}

function challengeStatus(): 'before' | 'active' | 'over' {
  if (DEMO_DATE < STARTS_ON) return 'before';
  if (DEMO_DATE > ENDS_ON) return 'over';
  return 'active';
}

function challengeDates(): string[] {
  const dates: string[] = [];
  const day = 86_400_000;
  const end = Date.parse(`${ENDS_ON}T00:00:00Z`);
  for (let time = Date.parse(`${STARTS_ON}T00:00:00Z`); time <= end; time += day) {
    dates.push(new Date(time).toISOString().slice(0, 10));
  }
  return dates;
}

const findMember = (key: string) => MEMBERS.find((m) => m.participant_key === key);
const rowKey = (date: string, key: string) => `${date}|${key}`;

function recordFor(row: Row) {
  return {
    entry_source: row.entry_source,
    checked_in_at: row.checked_in_at,
    reported_wake_window: row.reported_wake_window,
    wake_points: row.wake_points,
    sleep_back_at: row.sleep_back_at,
    daily_net: dailyNet(row),
  };
}

function getDashboard(participantKey: string) {
  const me = findMember(participantKey);
  if (!me) return { error: 'UNKNOWN_PARTICIPANT' };

  return {
    server_now: serverNow(),
    server_challenge_date: DEMO_DATE,
    challenge: {
      id: '00000000-0000-0000-0000-0000000000d0',
      name: 'Good Morning Challenge',
      starts_on: STARTS_ON,
      ends_on: ENDS_ON,
      timezone: TIMEZONE,
      status: challengeStatus(),
    },
    selected: { participant_key: me.participant_key, display_name: me.display_name },
    participants: MEMBERS.map((member) => {
      const row = rows.get(rowKey(DEMO_DATE, member.participant_key));
      return {
        participant_key: member.participant_key,
        display_name: member.display_name,
        today: row
          ? { has_record: true, ...recordFor(row) }
          : { has_record: false },
        cumulative_points: cumulativeFor(member.participant_key),
      };
    }),
    history: challengeDates().map((date) => ({
      date,
      rows: MEMBERS.map((member) => {
        const row = rows.get(rowKey(date, member.participant_key));
        return {
          participant_key: member.participant_key,
          display_name: member.display_name,
          record: row ? recordFor(row) : null,
        };
      }),
    })),
  };
}

function checkIn(participantKey: string) {
  if (!findMember(participantKey)) return { ok: false, code: 'UNKNOWN_PARTICIPANT' };
  if (challengeStatus() !== 'active') {
    return { ok: false, code: 'CHALLENGE_NOT_ACTIVE', challenge_date: DEMO_DATE };
  }

  const key = rowKey(DEMO_DATE, participantKey);
  if (rows.has(key)) return { ok: false, code: 'ALREADY_CHECKED_IN' };

  const checkedInAt = writeTimestamp();
  const wakePoints = wakePointsAt(DEMO_TIME);
  rows.set(key, {
    participant_key: participantKey,
    date: DEMO_DATE,
    entry_source: 'live',
    checked_in_at: checkedInAt,
    reported_wake_window: null,
    wake_points: wakePoints,
    sleep_back_at: null,
  });

  return {
    ok: true,
    code: 'OK',
    id: crypto.randomUUID(),
    challenge_date: DEMO_DATE,
    checked_in_at: checkedInAt,
    wake_points: wakePoints,
    daily_net: wakePoints,
  };
}

function markSleepBack(participantKey: string) {
  if (!findMember(participantKey)) return { ok: false, code: 'UNKNOWN_PARTICIPANT' };

  const row = rows.get(rowKey(DEMO_DATE, participantKey));
  if (!row) return { ok: false, code: 'NO_CHECK_IN_TODAY', challenge_date: DEMO_DATE };
  if (row.sleep_back_at) {
    return { ok: false, code: 'SLEEP_BACK_ALREADY_MARKED', sleep_back_at: row.sleep_back_at };
  }

  row.sleep_back_at = writeTimestamp();
  return { ok: true, code: 'OK', sleep_back_at: row.sleep_back_at, challenge_date: DEMO_DATE };
}

export async function demoRpc(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<DemoRpcResult> {
  const participantKey = String(args?.p_participant_key ?? '');
  switch (fn) {
    case 'get_dashboard':
      return { data: getDashboard(participantKey), error: null };
    case 'check_in_today':
      return { data: checkIn(participantKey), error: null };
    case 'mark_sleep_back_today':
      return { data: markSleepBack(participantKey), error: null };
    default:
      return { data: null, error: { message: `demo mode: unsupported RPC "${fn}"` } };
  }
}
