import type { ReactNode } from 'react';
import { COPY } from '../content/copy';
import { formatRecordSummary } from '../utils/format';
import type { DashboardParticipant } from '../types';

export function Scoreboard({
  participants,
  children,
}: {
  participants: DashboardParticipant[];
  children?: ReactNode;
}) {
  return (
    <section>
      <h2 style={{ marginBottom: 12 }}>{COPY.scoreboard}</h2>
      {children}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.2vh, 20px)' }}>
        {participants.map((p) => (
          <div key={p.participant_key} style={{
            padding: 'clamp(10px, 2.2vh, 20px) 14px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 16,
            border: '1px solid var(--card-border)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-h)', marginBottom: 4 }}>
              {`${p.display_name} ${COPY.totalPts} ${p.cumulative_points}`}
            </div>
            <div style={{ fontSize: 14, color: p.today.has_record ? 'var(--text)' : 'var(--text-muted)' }}>
              {`${COPY.today} ${formatRecordSummary(p)}`}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
