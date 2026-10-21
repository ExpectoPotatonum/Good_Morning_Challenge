export function wakePointsFromLocalTime(localTime: string): number {
  // localTime in HH:MM:SS
  const t = localTime;
  if (t < '06:31:00') return 5;
  if (t < '07:01:00') return 4;
  if (t < '07:31:00') return 3;
  if (t < '08:01:00') return 2;
  if (t < '08:31:00') return 1;
  return 0;
}

export function formatWakeFeedback(points: number): string {
  if (points === 0) return '0 pts — late';
  return `${points} pts`;
}

export function computeDailyNet(wakePoints: number, hadSleepBack: boolean): number {
  const pen = hadSleepBack ? 1 : 0;
  return wakePoints - pen;
}

export function computeCumulative(wakePointsSum: number, sleepBackCount: number): number {
  return wakePointsSum - sleepBackCount;
}
