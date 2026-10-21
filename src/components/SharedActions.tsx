import { useState, type ReactNode } from 'react';
import { COPY } from '../content/copy';
import { HistoryModal } from './HistoryModal';
import { RulesModal } from './RulesModal';
import type { DashboardHistoryDate } from '../types';

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
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.8vh, 18px)' }}>
        {children}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{ flex: 1 }} onClick={() => setShowRules(true)}>{COPY.rulesButton}</button>
          <button style={{ flex: 1 }} onClick={() => setShowHistory(true)}>{COPY.viewHistoryButton}</button>
        </div>
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
