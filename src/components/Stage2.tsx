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
    <div className="glass-card">
      <Scoreboard participants={participants}>
        {self && hasRecord && (
          <div style={{
            background: 'rgba(0,0,0,0.03)',
            borderRadius: 16,
            padding: 'clamp(14px, 2vh, 18px) 16px',
            marginBottom: 'clamp(16px, 2.2vh, 22px)',
            border: '1px solid var(--card-border)',
          }}>
            <div style={{ color: 'var(--text-h)', fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
              {COPY.youCheckedInTodayAt} {when}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 2 }}>
              {COPY.wakePointsLine} {formatPoints(self.today.wake_points)}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {COPY.totalScore} {formatPoints(self.cumulative_points)}
            </div>
          </div>
        )}
      </Scoreboard>

      <div style={{ marginTop: 'clamp(14px, 3vh, 30px)', paddingTop: 'clamp(12px, 2vh, 20px)', borderTop: '1px solid var(--border)' }}>
        <SharedActions history={history} serverDate={serverDate}>
          {self && hasRecord && !hasSleepBack && (
            <button className="btn-danger" onClick={openSleepModal} style={{ width: '100%', padding: 'clamp(12px, 1.8vh, 16px)', fontSize: 16, marginBottom: 'clamp(10px, 2vh, 18px)' }}>
              {COPY.sleepBackButton}
            </button>
          )}
        </SharedActions>
      </div>

      <Modal
        open={showSleep}
        onClose={() => setShowSleep(false)}
        label={COPY.didYouSleepBack}
        dismissible={!pending}
      >
        <h3 style={{ fontSize: 24, color: 'var(--danger)', marginBottom: 24 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
          <button className="btn-ghost" onClick={() => setShowSleep(false)} disabled={pending}>
            {COPY.sleepBackNah}
          </button>
          <button
            className="btn-danger"
            onClick={doSleepBack}
            disabled={pending}
          >
            {COPY.sleepBackYea}
          </button>
        </div>
        <div style={{ minHeight: 24, marginTop: 16, textAlign: 'right' }}>
          {pending && <p aria-live="polite" style={{ color: 'var(--text-muted)' }}>...</p>}
          {err && (
            <p style={{ color: 'var(--danger)', fontWeight: 600 }} role="alert">
              {err}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
