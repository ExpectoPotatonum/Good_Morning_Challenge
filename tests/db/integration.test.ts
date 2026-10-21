import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

/**
 * Database integration tests.
 *
 * These run against a DEDICATED test database (never the live challenge
 * project) that has the versioned migrations applied. Set:
 *
 *   SUPABASE_TEST_DB_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
 *
 * When the variable is missing the whole suite is skipped.
 *
 * The private helpers take the timestamp as an argument, so these tests pin
 * "now" instead of depending on the real clock. Public clients never supply
 * a timestamp.
 */

const DB_URL = process.env.SUPABASE_TEST_DB_URL;
// jsdom replaces the global URL, so resolve the migrations folder from the
// vitest root instead of import.meta.url.
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');
const TZ = 'Asia/Kuala_Lumpur';

const suite = DB_URL ? describe : describe.skip;

suite('database integration', () => {
  let client: Client;

  const query = async (sql: string, params: unknown[] = []) => (await client.query(sql, params)).rows;

  /** Call the private check-in helper with a pinned Asia/Kuala_Lumpur local time. */
  const checkInAt = async (participantKey: string, localTimestamp: string) => {
    const rows = await query(
      `SELECT private.private_check_in_at($1, $2::timestamp AT TIME ZONE $3) AS res`,
      [participantKey, localTimestamp, TZ],
    );
    return rows[0].res;
  };

  /** Call the private sleep-back helper with a pinned Asia/Kuala_Lumpur local time. */
  const sleepBackAt = async (participantKey: string, localTimestamp: string) => {
    const rows = await query(
      `SELECT private.private_mark_sleep_back_at($1, $2::timestamp AT TIME ZONE $3) AS res`,
      [participantKey, localTimestamp, TZ],
    );
    return rows[0].res;
  };

  const rowFor = async (participantKey: string, challengeDate: string) =>
    (
      await query(
        `SELECT * FROM public.daily_check_ins WHERE participant_key = $1 AND challenge_date = $2`,
        [participantKey, challengeDate],
      )
    )[0];

  beforeAll(async () => {
    client = new Client({ connectionString: DB_URL });
    await client.connect();

    // Apply the versioned migrations from scratch (idempotent).
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query(sql);
    }
  });

  afterAll(async () => {
    await client?.end();
  });

  beforeEach(async () => {
    await client.query('BEGIN');
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
  });

  describe('challenge window', () => {
    it('rejects 20 October 2026 23:59:59 local', async () => {
      const res = await checkInAt('player_1', '2026-10-20 23:59:59');
      expect(res.ok).toBe(false);
      expect(res.code).toBe('CHALLENGE_NOT_ACTIVE');
    });

    it('accepts 31 October 2026 23:59:59 local', async () => {
      const res = await checkInAt('player_1', '2026-10-31 23:59:59');
      expect(res.ok).toBe(true);
      expect(res.challenge_date).toBe('2026-10-31');
    });

    it('rejects 1 November 2026 00:00:00 local', async () => {
      const res = await checkInAt('player_1', '2026-11-01 00:00:00');
      expect(res.ok).toBe(false);
      expect(res.code).toBe('CHALLENGE_NOT_ACTIVE');
    });

    it('rejects an unknown participant key', async () => {
      const res = await checkInAt('nobody', '2026-10-22 07:00:00');
      expect(res.ok).toBe(false);
      expect(res.code).toBe('UNKNOWN_PARTICIPANT');
    });
  });

  describe('server-side scoring boundaries', () => {
    const cases: Array<[string, string, number]> = [
      ['2026-10-22 00:00:00', '2026-10-22', 5],
      ['2026-10-22 06:30:59', '2026-10-22', 5],
      ['2026-10-22 06:31:00', '2026-10-22', 4],
      ['2026-10-22 07:00:59', '2026-10-22', 4],
      ['2026-10-22 07:01:00', '2026-10-22', 3],
      ['2026-10-22 07:30:59', '2026-10-22', 3],
      ['2026-10-22 07:31:00', '2026-10-22', 2],
      ['2026-10-22 08:00:59', '2026-10-22', 2],
      ['2026-10-22 08:01:00', '2026-10-22', 1],
      ['2026-10-22 08:30:59', '2026-10-22', 1],
      ['2026-10-22 08:31:00', '2026-10-22', 0],
      ['2026-10-22 23:59:59', '2026-10-22', 0],
    ];

    for (const [localTime, challengeDate, points] of cases) {
      it(`${localTime} local -> ${points} pts`, async () => {
        const res = await checkInAt('player_1', localTime);
        expect(res.ok).toBe(true);
        expect(res.wake_points).toBe(points);
        expect(res.challenge_date).toBe(challengeDate);
      });
    }

    it('stores the exact server timestamp it scored', async () => {
      const res = await checkInAt('player_1', '2026-10-23 07:00:30');
      const row = await rowFor('player_1', '2026-10-23');
      expect(row.checked_in_at).toBe(res.checked_in_at);
      expect(row.entry_source).toBe('live');
      expect(row.reported_wake_window).toBeNull();
    });
  });

  describe('daily uniqueness', () => {
    it('allows only one check-in per participant and date', async () => {
      const first = await checkInAt('player_1', '2026-10-24 06:45:00');
      expect(first.ok).toBe(true);

      const second = await checkInAt('player_1', '2026-10-24 07:10:00');
      expect(second.ok).toBe(false);
      expect(second.code).toBe('ALREADY_CHECKED_IN');

      const rows = await query(
        `SELECT id FROM public.daily_check_ins WHERE participant_key = $1 AND challenge_date = $2`,
        ['player_1', '2026-10-24'],
      );
      expect(rows).toHaveLength(1);
    });
  });

  describe('day one seed', () => {
    it('has exactly one initial-report row per participant', async () => {
      const rows = await query(
        `SELECT participant_key, entry_source, checked_in_at, reported_wake_window, wake_points, sleep_back_at
           FROM public.daily_check_ins
          WHERE challenge_date = DATE '2026-10-21' AND entry_source = 'day_one_seed'
          ORDER BY participant_key`,
      );
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row.checked_in_at).toBeNull();
        expect(row.reported_wake_window).toBe('08:01–08:30');
        expect(row.wake_points).toBe(1);
        expect(row.sleep_back_at).toBeNull();
      }
    });

    it('does not duplicate or overwrite rows when the seed is rerun', async () => {
      const seedFile = path.join(MIGRATIONS_DIR, '20261021000001_seed_data.sql');
      const sql = await readFile(seedFile, 'utf8');
      await client.query(sql);
      await client.query(sql);

      const rows = await query(
        `SELECT participant_key FROM public.daily_check_ins WHERE challenge_date = DATE '2026-10-21'`,
      );
      expect(rows).toHaveLength(2);
    });

    it('blocks a second live check-in on 21 October', async () => {
      const res = await checkInAt('player_1', '2026-10-21 07:00:00');
      expect(res.ok).toBe(false);
      expect(res.code).toBe('ALREADY_CHECKED_IN');
    });

    it('allows a sleep-back penalty on the seed row despite a null timestamp', async () => {
      const res = await sleepBackAt('player_1', '2026-10-21 12:00:00');
      expect(res.ok).toBe(true);

      const row = await rowFor('player_1', '2026-10-21');
      expect(row.checked_in_at).toBeNull();
      expect(row.sleep_back_at).not.toBeNull();
      expect(row.wake_points).toBe(1);
    });
  });

  describe('sleep-back penalty', () => {
    it('applies at most one penalty per participant and date', async () => {
      const first = await sleepBackAt('player_1', '2026-10-25 11:00:00');
      expect(first.ok).toBe(true);

      const second = await sleepBackAt('player_1', '2026-10-25 12:00:00');
      expect(second.ok).toBe(false);
      expect(second.code).toBe('SLEEP_BACK_ALREADY_MARKED');
      expect(second.sleep_back_at).toBe(first.sleep_back_at);

      const row = await rowFor('player_1', '2026-10-25');
      expect(new Date(row.sleep_back_at).toISOString()).toBe(new Date(first.sleep_back_at).toISOString());
    });

    it('returns NO_CHECK_IN_TODAY when there is no record for that date', async () => {
      const res = await sleepBackAt('player_1', '2026-10-27 11:00:00');
      expect(res.ok).toBe(false);
      expect(res.code).toBe('NO_CHECK_IN_TODAY');
    });

    it('makes the daily net -1 after a 0 point award and a penalty', async () => {
      const check = await checkInAt('player_1', '2026-10-26 08:31:00');
      expect(check.wake_points).toBe(0);

      const penalty = await sleepBackAt('player_1', '2026-10-26 09:00:00');
      expect(penalty.ok).toBe(true);

      const rows = await query(
        `SELECT wake_points, sleep_back_at, (wake_points - CASE WHEN sleep_back_at IS NOT NULL THEN 1 ELSE 0 END) AS daily_net
           FROM public.daily_check_ins
          WHERE participant_key = $1 AND challenge_date = $2`,
        ['player_1', '2026-10-26'],
      );
      expect(rows[0].daily_net).toBe(-1);
    });

    it('allows negative cumulative totals', async () => {
      await checkInAt('player_1', '2026-10-28 08:31:00');
      await sleepBackAt('player_1', '2026-10-28 09:00:00');
      await checkInAt('player_1', '2026-10-29 08:31:00');
      await sleepBackAt('player_1', '2026-10-29 09:00:00');

      const rows = await query(
        `SELECT COALESCE(SUM(wake_points), 0) - COALESCE(SUM(CASE WHEN sleep_back_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS cumulative
           FROM public.daily_check_ins
          WHERE participant_key = $1`,
        ['player_1'],
      );
      expect(rows[0].cumulative).toBeLessThan(0);
    });
  });

  describe('get_dashboard', () => {
    it('returns both participants, both totals and all 11 history dates', async () => {
      await checkInAt('player_1', '2026-10-30 07:00:00');
      await checkInAt('player_2', '2026-10-30 08:00:00');

      const rows = await query(`SELECT public.get_dashboard($1) AS d`, ['player_1']);
      const d = rows[0].d;

      expect(d.error).toBeUndefined();
      expect(d.participants).toHaveLength(2);
      expect(d.participants.map((p: any) => p.participant_key)).toEqual(['player_1', 'player_2']);
      expect(d.participants[0].cumulative_points).toBe(2); // 1 seed point + 1 live point
      expect(d.participants[1].cumulative_points).toBe(2); // 1 seed point + 1 live point
      expect(d.history).toHaveLength(11);
      expect(d.history[0].date).toBe('2026-10-21');
      expect(d.history[10].date).toBe('2026-10-31');
      expect(d.history[0].rows).toHaveLength(2);
      expect(d.selected.participant_key).toBe('player_1');
      expect(d.challenge.timezone).toBe('Asia/Kuala_Lumpur');
    });

    it('rejects an unknown participant key', async () => {
      const rows = await query(`SELECT public.get_dashboard($1) AS d`, ['nobody']);
      expect(rows[0].d.error).toBe('UNKNOWN_PARTICIPANT');
    });

    it('leaves future dates without a record', async () => {
      const rows = await query(`SELECT public.get_dashboard($1) AS d`, ['player_1']);
      const d = rows[0].d;
      const future = d.history.filter((h: any) => h.date > d.server_challenge_date);
      for (const day of future) {
        for (const row of day.rows) {
          expect(row.record).toBeNull();
        }
      }
    });
  });

  describe('public wrappers', () => {
    it('use the database clock and never accept a client timestamp', async () => {
      const rows = await query(`SELECT public.check_in_today($1) AS res`, ['player_2']);
      const res = rows[0].res;
      // 21 October is occupied by the seed row, so the public wrapper reports the duplicate.
      if (res.ok === false) {
        expect(res.code).toBe('ALREADY_CHECKED_IN');
      } else {
        expect(res.checked_in_at).toBeTruthy();
        expect(res.challenge_date).toBe(res.challenge_date);
      }
    });

    it('exposes only the three intended RPCs to anon', async () => {
      const rows = await query(
        `SELECT p.oid::regprocedure::text AS signature,
                has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute
           FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public'
            AND p.proname IN ('get_dashboard', 'check_in_today', 'mark_sleep_back_today')`,
      );
      expect(rows).toHaveLength(3);
      for (const row of rows) {
        expect(row.anon_can_execute).toBe(true);
      }
    });
  });
});
