import { Scoreboard } from './Scoreboard';
import { SharedActions } from './SharedActions';
import type { DashboardHistoryDate, DashboardParticipant } from '../types';

export function Stage3({
  participants,
  history,
  serverDate,
}: {
  participants: DashboardParticipant[];
  history: DashboardHistoryDate[];
  serverDate?: string;
}) {
  return (
    <div className="glass-card">
      <Scoreboard participants={participants} />
      <div style={{ marginTop: 'clamp(14px, 3vh, 30px)', paddingTop: 'clamp(12px, 2vh, 20px)', borderTop: '1px solid var(--border)' }}>
        <SharedActions history={history} serverDate={serverDate} />
      </div>
    </div>
  );
}
