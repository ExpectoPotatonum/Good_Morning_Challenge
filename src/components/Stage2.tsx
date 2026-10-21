import { useState } from 'react';
import { COPY, pickOne, SLEEP_BACK_TITLES } from '../content/copy';
import { supabase } from '../lib/supabase';
import { useApp } from '../useApp';
import { Modal } from './Modal';
import { Scoreboard } from './Scoreboard';
import { SharedActions } from './SharedActions';
import { formatChallengeTimestamp, formatPoints } from '../utils/format';
import type { DashboardHistoryDate, DashboardParticipant } from '../types';

export function Stage2({
  participants,
  selected,
  history,
  serverDate,
}: {
  participants: DashboardParticipant[];
  selected: { participant_key: string; display_name: string };
  history: DashboardHistoryDate[];
  serverDate?: string;
}) {
  const { refresh } = useApp();
  const self = participants.find((p) => p.participant_key === selected.participant_key);
  const [showSleep, setShowSleep] = useState(false);
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasSleepBack = !!self?.today.sleep_back_at;
  const hasRecord = !!self?.today.has_record;

  const openSleepModal = () => {
    setTitle(pickOne(SLEEP_BACK_TITLES));
    setErr(null);
    setShowSleep(true);
  };

  const doSleepBack = async () => {
    if (!selected.participant_key || pending || hasSleepBack) return;
    setPending(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc('mark_sleep_back_today', {
        p_participant_key: selected.participant_key,
      });
      if (error) {
        setErr(error.message || 'DATABASE_ERROR');
        setPending(false);
        return;
      }
      const res = data as any;
      if (res?.code === 'SLEEP_BACK_ALREADY_MARKED') {
        // Another device already applied it: refetch and render the persisted stage.
        await refresh();
        setPending(false);
        setShowSleep(false);
        return;
      }
      if (res?.ok) {
        await refresh();
        setPending(false);
        setShowSleep(false);
        return;
      }
      setErr(res?.code || 'DATABASE_ERROR');
      setPending(false);
    } catch (e: any) {
      setErr(e?.message || 'DATABASE_ERROR');
      setPending(false);
    }
  };

  const when =
    self?.today.entry_source === 'day_one_seed'
      ? COPY.initialReportLabel
      : formatChallengeTimestamp(self?.today.checked_in_at);

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <Scoreboard participants={participants}>
        {self && hasRecord && (
          <div style={{ marginBottom: 12 }}>
            <div>
              {COPY.youCheckedInTodayAt} {when}
            </div>
            <div>
              {COPY.wakePointsLine} {formatPoints(self.today.wake_points)}
            </div>
            <div>
              {COPY.totalScore} {formatPoints(self.cumulative_points)}
            </div>
          </div>
        )}
      </Scoreboard>

      <SharedActions history={history} serverDate={serverDate}>
        {self && hasRecord && !hasSleepBack && (
          <button onClick={openSleepModal}>{COPY.sleepBackButton}</button>
        )}
      </SharedActions>

      <Modal
        open={showSleep}
        onClose={() => setShowSleep(false)}
        label={COPY.didYouSleepBack}
        dismissible={!pending}
      >
        <h3>{title}</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowSleep(false)} disabled={pending}>
            {COPY.sleepBackNah}
          </button>
          <button
            onClick={doSleepBack}
            disabled={pending}
            style={{ background: 'crimson', color: '#fff', border: 'none', padding: '6px 12px' }}
          >
            {COPY.sleepBackYea}
          </button>
        </div>
        {pending && <p aria-live="polite">...</p>}
        {err && (
          <p style={{ color: 'crimson' }} role="alert">
            {err}
          </p>
        )}
      </Modal>
    </div>
  );
}
