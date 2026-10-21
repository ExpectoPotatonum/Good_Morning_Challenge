import { Scoreboard } from './Scoreboard';
import { SharedActions } from './SharedActions';
import type { DashboardHistoryDate, DashboardParticipant } from '../types';

/**
 * Stage 3 — shared scoreboard, rules and history after a sleep-back penalty
 * was confirmed. The personal status panel and sleep-back prompt are hidden,
 * the shared scoreboard stays.
 */
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
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <Scoreboard participants={participants} />
      <SharedActions history={history} serverDate={serverDate} />
    </div>
  );
}
