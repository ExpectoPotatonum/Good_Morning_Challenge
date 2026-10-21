import { COPY } from '../content/copy';
import type { DashboardParticipant } from '../types';

/** Canonical timezone used for scoring and for every displayed timestamp. */
export const CHALLENGE_TIMEZONE = 'Asia/Kuala_Lumpur';

/**
 * Label shown next to a timestamp. The canonical timezone is a fixed UTC+08:00
 * offset with no daylight saving, so the short label is enough for the UI.
 */
export const CHALLENGE_UTC_LABEL = 'UTC+8';

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
 * displayed timestamp is rendered explicitly in the challenge timezone with
 * seconds and a short `UTC+8` label.
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
  return `${date}, ${time} ${CHALLENGE_UTC_LABEL}`;
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

/**
 * Today's record for one participant as a single line of text:
 * `08:01–08:30 — initial report (1 wake points)`.
 *
 * Seeded rows keep their reported window (there is no exact timestamp to
 * show); live rows show the exact server timestamp.
 */
export function formatRecordSummary(participant: DashboardParticipant): string {
  const today = participant.today;
  if (!today.has_record) return COPY.notCheckedIn;

  const when =
    today.entry_source === 'day_one_seed'
      ? COPY.initialReportLabel
      : formatChallengeTimestamp(today.checked_in_at);

  const base = `${when} (${today.wake_points} ${COPY.wakePoints})`;
  return today.sleep_back_at ? `${base} · ${COPY.sleepBack}` : base;
}
