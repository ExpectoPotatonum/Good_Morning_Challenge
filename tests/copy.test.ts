import { COPY, PARTICIPANTS, pickOne, SLEEP_BACK_TITLES, STAGE1_BUTTONS, WAKE_POINT_TABLE } from '../src/content/copy';
import {
  CHALLENGE_TIMEZONE,
  formatAward,
  formatChallengeDate,
  formatChallengeTimestamp,
  formatPoints,
  isFutureDate,
} from '../src/utils/format';

describe('copy variants', () => {
  it('stage 1 has the five titles plus the image-backed variant', () => {
    const labels = STAGE1_BUTTONS.map((v) => v.label);
    expect(labels).toContain('GOOD MOANING');
    expect(labels).toContain('GOOD MEOWING');
    expect(labels).toContain('GOOD MORNING');
    expect(labels).toContain('good morning');
    expect(labels).toContain('早上好中国，现在我有冰淇淋，我很喜欢冰淇淋');
    expect(STAGE1_BUTTONS.some((v) => v.image === 'zao')).toBe(true);
  });

  it('sleep-back modal has every title from the spec', () => {
    expect(SLEEP_BACK_TITLES).toHaveLength(11);
    expect(SLEEP_BACK_TITLES).toContain('hehe ur losing 1 pt');
    expect(SLEEP_BACK_TITLES).toContain('today rly tired sia');
  });

  it('exact required strings are present', () => {
    expect(COPY.stage1Helper).toBe('click below to check in for the day');
    expect(COPY.notHavingGoodMorning).toBe('Not having a good morning? Click me');
    expect(COPY.meowBlessing).toBe(':ur blessed by meowmeow, now GOOD MORNING to you');
    expect(COPY.yay).toBe('yay');
    expect(COPY.sleepBackYea).toBe('Yea ig...');
    expect(COPY.sleepBackNah).toBe('NAH JK i click for fun');
    expect(COPY.didYouSleepBack).toBe('did you sleep back?');
    expect(COPY.switchPlayer).toBe('Switch player');
    expect(COPY.initialReportLabel).toBe('08:01–08:30 — initial report');
    expect(COPY.challengeOver).toBe('Challenge over');
  });

  it('exactly two participants are selectable', () => {
    expect(PARTICIPANTS).toHaveLength(2);
    expect(PARTICIPANTS.map((p) => p.key)).toEqual(['player_1', 'player_2']);
  });

  it('pickOne always returns a member of the list', () => {
    for (let i = 0; i < 50; i++) {
      expect(SLEEP_BACK_TITLES).toContain(pickOne(SLEEP_BACK_TITLES));
    }
  });
});

describe('wake point table', () => {
  it('lists the six point bands with exact boundaries', () => {
    expect(WAKE_POINT_TABLE).toEqual([
      { window: '00:00:00 – 06:30:59', points: 5 },
      { window: '06:31:00 – 07:00:59', points: 4 },
      { window: '07:01:00 – 07:30:59', points: 3 },
      { window: '07:31:00 – 08:00:59', points: 2 },
      { window: '08:01:00 – 08:30:59', points: 1 },
      { window: '08:31:00 – 23:59:59', points: 0 },
    ]);
  });
});

describe('challenge-local formatting', () => {
  it('formats timestamps in Asia/Kuala_Lumpur with seconds and the timezone', () => {
    expect(formatChallengeTimestamp('2026-10-21T00:00:00Z')).toBe(
      `21 Oct 2026, 08:00:00 (${CHALLENGE_TIMEZONE})`,
    );
    expect(formatChallengeTimestamp('2026-10-21T23:15:07Z')).toBe(
      `22 Oct 2026, 07:15:07 (${CHALLENGE_TIMEZONE})`,
    );
  });

  it('renders the same instant the same way regardless of the browser timezone', () => {
    const iso = '2026-10-22T01:02:03Z';
    const original = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      const ny = formatChallengeTimestamp(iso);
      process.env.TZ = 'UTC';
      const utc = formatChallengeTimestamp(iso);
      expect(ny).toBe(utc);
    } finally {
      process.env.TZ = original;
    }
  });

  it('formats challenge dates without shifting them', () => {
    expect(formatChallengeDate('2026-10-21')).toBe('21 Oct 2026');
    expect(formatChallengeDate('2026-10-31')).toBe('31 Oct 2026');
  });

  it('detects future dates against the server challenge date', () => {
    expect(isFutureDate('2026-10-22', '2026-10-21')).toBe(true);
    expect(isFutureDate('2026-10-21', '2026-10-21')).toBe(false);
    expect(isFutureDate('2026-10-20', '2026-10-21')).toBe(false);
  });

  it('formats point awards including the late feedback', () => {
    expect(formatAward(0)).toBe('0 pts — late');
    expect(formatAward(5)).toBe('5 pts');
    expect(formatAward(1)).toBe('1 pt');
    expect(formatPoints(undefined)).toBe('');
  });
});
