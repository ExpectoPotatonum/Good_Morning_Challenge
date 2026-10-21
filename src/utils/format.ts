export const CHALLENGE_TIMEZONE = 'Asia/Kuala_Lumpur';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Format a server timestamp in the canonical challenge timezone.
 * Official scoring never uses the browser clock or browser timezone, so every
 * displayed timestamp is rendered explicitly in Asia/Kuala_Lumpur with seconds.
 */
export function formatChallengeTimestamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: CHALLENGE_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: CHALLENGE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(d);
  return `${date}, ${time} (${CHALLENGE_TIMEZONE})`;
}

/** Format a plain `YYYY-MM-DD` challenge date without timezone shifting. */
export function formatChallengeDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** ISO `YYYY-MM-DD` strings sort lexicographically, so plain comparison is safe. */
export function isFutureDate(date: string, serverDate: string | undefined): boolean {
  if (!serverDate) return false;
  return date > serverDate;
}

export function formatPoints(points: number | undefined | null): string {
  if (points === undefined || points === null) return '';
  return `${points} ${points === 1 ? 'pt' : 'pts'}`;
}

/** Award feedback, e.g. `4 pts` or `0 pts — late`. */
export function formatAward(points: number): string {
  return points === 0 ? '0 pts — late' : formatPoints(points);
}
