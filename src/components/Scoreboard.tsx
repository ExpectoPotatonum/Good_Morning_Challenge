import { COPY } from '../content/copy';
import { formatChallengeTimestamp, formatPoints } from '../utils/format';
import type { DashboardParticipant } from '../types';

/** Today's record for one participant, shared by the scoreboard and history. */
export function RecordSummary({ participant }: { participant: DashboardParticipant }) {
  const today = participant.today;
  if (!today.has_record) {
    return <span style={{ color: '#888' }}>{COPY.notCheckedIn}</span>;
  }

  const when =
    today.entry_source === 'day_one_seed'
      ? COPY.initialReportLabel
      : formatChallengeTimestamp(today.checked_in_at);

  return (
    <span>
      {when}
      {' · '}
      {formatPoints(today.wake_points)} {COPY.wakePoints}
      {' · '}
      {COPY.dailyNet} {today.daily_net}
      {today.sleep_back_at ? ` · ${COPY.sleepBack}` : ''}
    </span>
  );
}

/**
 * Shared two-person scoreboard. Visible from Stage 2 onward and in the
 * challenge-over view. Shows cumulative points plus each participant's
 * today's check-in time / reported window.
 */
export function Scoreboard({ participants }: { participants: DashboardParticipant[] }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2>{COPY.scoreboard}</h2>
      {participants.map((p) => (
        <div key={p.participant_key} style={{ margin: '8px 0' }}>
          <div>
            <strong>{p.display_name}</strong> — {COPY.cumulative}:{' '}
            <strong>{p.cumulative_points}</strong>
          </div>
          <div style={{ fontSize: 14 }}>
            Today: <RecordSummary participant={p} />
          </div>
        </div>
      ))}
    </section>
  );
}
