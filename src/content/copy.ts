export type Stage = 1 | 2 | 3;

export const STAGE1_BUTTONS = [
  'GOOD MOANING',
  'GOOD MEOWING',
  'GOOD MORNING',
  'good morning',
  '早上好中国，现在我有冰淇淋，我很喜欢冰淇淋',
] as const;

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

export const COPY = {
  stage1Helper: 'click below to check in for the day',
  notHavingGoodMorning: 'Not having a good morning? Click me',
  meowBlessing: ':ur blessed by meowmeow, now GOOD MORNING to you',
  yay: 'yay',
  switchPlayer: 'Switch player',
  didYouSleepBack: 'did you sleep back?',
  sleepBackYea: 'Yea ig...',
  sleepBackNah: 'NAH JK i click for fun',
  rules: 'rules',
  viewHistory: 'view history',
  challengeOver: 'Challenge over',
  notCheckedIn: 'Not checked in',
  futureDash: '—',
  initialReportLabel: '08:01–08:30 — initial report',
  todayCheckInAt: "Today's check in at:",
} as const;

export function pickOne<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('empty');
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}
