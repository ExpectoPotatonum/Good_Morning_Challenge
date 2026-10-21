import type { ReactNode } from 'react';
import { COPY } from '../content/copy';
import { formatRecordSummary } from '../utils/format';
import type { DashboardParticipant } from '../types';

/**
 * Shared two-person scoreboard. Visible from Stage 2 onward and in the
 * challenge-over view. Shows cumulative points plus each participant's
 * today's check-in time / reported window.
 *
 * `children` renders between the heading and the rows: Stage 2 uses it for the
 * selected participant's status lines.
 */
export function Scoreboard({
  participants,
  children,
}: {
  participants: DashboardParticipant[];
  children?: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2>{COPY.scoreboard}</h2>
      {children}
      {participants.map((p) => (
        <div key={p.participant_key} style={{ margin: '8px 0' }}>
          <div style={{ fontWeight: 600 }}>
            {`${p.display_name} ${COPY.totalPts} ${p.cumulative_points}`}
          </div>
          <div style={{ fontSize: 14, color: p.today.has_record ? undefined : '#888' }}>
            {`${COPY.today} ${formatRecordSummary(p)}`}
          </div>
        </div>
      ))}
    </section>
  );
}
