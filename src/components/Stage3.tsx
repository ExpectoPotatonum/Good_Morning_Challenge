import { COPY } from '../content/copy';
import type { DashboardParticipant } from '../types';

export function Stage3({ participants }: { participants: DashboardParticipant[]; selected?: any }) {
  const fmtTime = (s?: string | null) => {
    if (!s) return '';
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <section style={{ marginBottom: 20 }}>
        <h2>Scoreboard</h2>
        {participants.map((p) => (
          <div key={p.participant_key} style={{ margin: '6px 0' }}>
            <strong>{p.display_name}</strong> — cumulative: {p.cumulative_points}
            <div style={{ fontSize: 14 }}>
              Today: {p.today.has_record ? (
                <>
                  {p.today.entry_source === 'day_one_seed' ? (
                    <span>{COPY.initialReportLabel}</span>
                  ) : (
                    <span>{p.today.checked_in_at && fmtTime(p.today.checked_in_at)}</span>
                  )}
                  {' '}({p.today.wake_points} wake, {p.today.daily_net} net{p.today.sleep_back_at ? ', slept back' : ''})
                </>
              ) : 'Not checked in'}
            </div>
          </div>
        ))}
      </section>
      <section>
        <button>{COPY.rules}</button>
        <button style={{ marginLeft: 8 }}>{COPY.viewHistory}</button>
      </section>
    </div>
  );
}
