export type Stage = 1 | 2 | 3;

/**
 * The two selectable participants. These must stay in sync with the
 * `challenge_members` rows created by `supabase/migrations/20261021000001_seed_data.sql`
 * (see `20261021000008_participant_names.sql` for the display names).
 * They are public labels, not credentials.
 */
export const PARTICIPANTS: ReadonlyArray<{ key: string; displayName: string }> = [
  { key: 'player_1', displayName: 'Jet' },
  { key: 'player_2', displayName: 'Bingsu' },
];

export type Stage1Variant = {
  label: string;
  /** Optional image-backed variant using an asset already in the repo. */
  image?: 'zao';
};

export const STAGE1_BUTTONS: readonly Stage1Variant[] = [
  { label: 'GOOD MOANING' },
  { label: 'GOOD MEOWING' },
  { label: 'GOOD MORNING' },
  { label: 'good morning' },
  { label: '早上好中国，现在我有冰淇淋，我很喜欢冰淇淋' },
  { label: 'GOOD MORNING', image: 'zao' },
];

export const SLEEP_BACK_TITLES = [
  'Oh no reallyyyy?',
  'oh no reallyyy?',
  'oh SHIT...',
  'NAURRRRRR',
  'oooops',
  'BRUV',
  'hehe ur losing 1 pt',
  'not this time...',
  'TOO TIRED SIA',
  'CMI',
  'today rly tired sia',
] as const;

export const WAKE_POINT_TABLE: ReadonlyArray<{ window: string; points: number }> = [
  { window: '00:00:00 – 06:30:59', points: 5 },
  { window: '06:31:00 – 07:00:59', points: 4 },
  { window: '07:01:00 – 07:30:59', points: 3 },
  { window: '07:31:00 – 08:00:59', points: 2 },
  { window: '08:01:00 – 08:30:59', points: 1 },
  { window: '08:31:00 – 23:59:59', points: 0 },
];

export const RULES_BULLETS: readonly string[] = [
  'Challenge dates: 21–31 October 2026 inclusive.',
  'Official timezone: UTC+8.',
  'The server receives the official check-in time; points are based on that received timestamp.',
  'Late check-in (08:31:00 or later) earns 0 wake points.',
  'A confirmed sleep-back subtracts 1 from cumulative points, at most once per participant per date.',
  'Cumulative scores may be negative.',
  'The 21 October starting entries are initial reports for 08:01–08:30 and do not have exact timestamps.',
];

export const COPY = {
  stage1Helper: 'click below to check in for the day',
  notHavingGoodMorning: 'Not having a good morning? Click me',
  meowBlessing: ':ur blessed by meowmeow, now GOOD MORNING to you',
  yay: 'yay',
  switchPlayer: 'Switch player',
  didYouSleepBack: 'did u slp back?',
  sleepBackButton: '(did u slp back?)',
  sleepBackYea: 'Yea ig...',
  sleepBackNah: 'NAH JK i click for fun',
  rules: 'rules',
  rulesButton: '(rules)',
  viewHistory: 'view history',
  viewHistoryButton: '(view history)',
  challengeOver: 'Challenge over',
  challengeNotStarted: 'Challenge not started yet',
  notCheckedIn: 'Not checked in',
  futureDash: '—',
  initialReportLabel: '08:01–08:30',
  youCheckedInTodayAt: 'You checked in today at:',
  wakePointsLine: 'wake points:',
  totalScore: 'total score:',
  totalPts: 'total pts:',
  today: 'Today:',
  scoreboard: 'Scoreboard',
  wakePoints: 'wake points',
  sleepBack: 'slept back',
  noSleepBack: 'no sleep back',
  pointsSuffix: 'pts',
  lateSuffix: '— late',
  close: 'Close',
  pickPlayer: 'who r u',
} as const;

export function pickOne<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('empty');
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}
