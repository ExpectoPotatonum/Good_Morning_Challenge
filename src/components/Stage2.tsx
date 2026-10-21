import { useState } from 'react';
import { useApp } from '../AppContext';
import { COPY, pickOne, SLEEP_BACK_TITLES } from '../content/copy';
import { supabase } from '../lib/supabase';
import type { DashboardParticipant } from '../types';

export function Stage2({ participants, selected }: { participants: DashboardParticipant[]; selected: { participant_key: string; display_name: string } }) {
  const { refresh } = useApp();
  const self = participants.find((p) => p.participant_key === selected.participant_key);
  const others = participants.filter((p) => p.participant_key !== selected.participant_key);
  const [showSleep, setShowSleep] = useState(false);
  const [title] = useState(() => pickOne(SLEEP_BACK_TITLES));
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasSleepBack = !!self?.today.sleep_back_at;
  const hasRecord = self?.today.has_record;

  const doSleepBack = async () => {
    if (!selected.participant_key || pending || hasSleepBack) return;
    setPending(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc('mark_sleep_back_today', { p_participant_key: selected.participant_key });
      if (error) {
        setErr('DATABASE_ERROR');
        setPending(false);
        return;
      }
      const res = data as any;
      if (res?.code === 'SLEEP_BACK_ALREADY_MARKED') {
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
    } catch (e) {
      setErr('DATABASE_ERROR');
      setPending(false);
    }
  };

  const fmtTime = (s?: string | null) => {
    if (!s) return '';
    return new Date(s).toLocaleString();
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <section style={{ marginBottom: 20 }}>
        <h2>Scoreboard</h2>
        {[self, ...others].filter(Boolean).map((p: any) => (
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

      {self && hasRecord && !hasSleepBack && (
        <section style={{ marginBottom: 20 }}>
          <div>
            {COPY.todayCheckInAt}{' '}
            {self.today.entry_source === 'day_one_seed' ? COPY.initialReportLabel : (self.today.checked_in_at && fmtTime(self.today.checked_in_at))}
          </div>
          <div>wake: {self.today.wake_points}</div>
          <button onClick={() => { setShowSleep(true); setErr(null); }}>{COPY.didYouSleepBack}</button>
        </section>
      )}

      <section>
        <button>{COPY.rules}</button>
        <button style={{ marginLeft: 8 }}>{COPY.viewHistory}</button>
      </section>

      {showSleep && (
        <dialog open style={{ border: 'none', borderRadius: 8, padding: 20, maxWidth: 360 }}>
          <h3>{title}</h3>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowSleep(false)} disabled={pending}>{COPY.sleepBackNah}</button>
            <button onClick={doSleepBack} disabled={pending} style={{ background: 'crimson', color: '#fff' }}>{COPY.sleepBackYea}</button>
          </div>
          {pending && <p>...</p>}
          {err && <p style={{ color: 'crimson' }}>{err}</p>}
        </dialog>
      )}
    </div>
  );
}
