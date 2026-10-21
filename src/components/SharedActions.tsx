import { useState } from 'react';
import { COPY } from '../content/copy';
import { HistoryModal } from './HistoryModal';
import { RulesModal } from './RulesModal';
import type { DashboardHistoryDate } from '../types';

/**
 * Rules + history access. Visible from Stage 2 onward and in the
 * challenge-over view.
 */
export function SharedActions({
  history,
  serverDate,
}: {
  history: DashboardHistoryDate[];
  serverDate?: string;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <section>
        <button onClick={() => setShowRules(true)}>{COPY.rules}</button>
        <button style={{ marginLeft: 8 }} onClick={() => setShowHistory(true)}>
          {COPY.viewHistory}
        </button>
      </section>
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />
      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        serverDate={serverDate}
      />
    </>
  );
}
