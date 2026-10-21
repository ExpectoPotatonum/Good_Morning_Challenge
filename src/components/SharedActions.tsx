import { useState, type ReactNode } from 'react';
import { COPY } from '../content/copy';
import { HistoryModal } from './HistoryModal';
import { RulesModal } from './RulesModal';
import type { DashboardHistoryDate } from '../types';

/**
 * Rules + history access. Visible from Stage 2 onward and in the
 * challenge-over view. `children` renders first, so Stage 2 can put the
 * sleep-back prompt in front of the rules and history controls.
 */
export function SharedActions({
  history,
  serverDate,
  children,
}: {
  history: DashboardHistoryDate[];
  serverDate?: string;
  children?: ReactNode;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <section
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
      >
        {children}
        <button onClick={() => setShowRules(true)}>{COPY.rulesButton}</button>
        <button onClick={() => setShowHistory(true)}>{COPY.viewHistoryButton}</button>
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
