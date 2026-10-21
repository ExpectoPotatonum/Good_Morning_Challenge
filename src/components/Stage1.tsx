import { useState } from 'react';
import { COPY, pickOne, STAGE1_BUTTONS } from '../content/copy';
import { supabase } from '../lib/supabase';
import { useApp } from '../useApp';
import { Modal } from './Modal';
import { formatAward } from '../utils/format';
import meow from '../../meowmeow.webp';
import zao from '../../早安图.webp';

export function Stage1() {
  const { participantKey, refresh } = useApp();
  // One variant per Stage 1 entry/reload, not per render.
  const [variant] = useState(() => pickOne(STAGE1_BUTTONS));
  const [imageFailed, setImageFailed] = useState(false);
  const [showMeow, setShowMeow] = useState(false);
  const [pending, setPending] = useState(false);
  const [award, setAward] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const busy = pending || award !== null;

  /**
   * The single check-in action. The main button and the modal `yay` button
   * both call this, so both award points and record the same server timestamp.
   */
  const doCheckIn = async () => {
    if (!participantKey || busy) return;
    setPending(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc('check_in_today', { p_participant_key: participantKey });
      if (error) {
        setErr(error.message || 'DATABASE_ERROR');
        setPending(false);
        return;
      }
      const res = data as any;
      if (res?.code === 'ALREADY_CHECKED_IN') {
        // Persisted state wins: refetch and let the app render the right stage.
        await refresh();
        setPending(false);
        setShowMeow(false);
        return;
      }
      if (res?.ok) {
        setAward(typeof res.wake_points === 'number' ? res.wake_points : 0);
        setPending(false);
        // Let the award be read, then close the modal and move on to Stage 2.
        window.setTimeout(async () => {
          setShowMeow(false);
          await refresh();
        }, 1400);
        return;
      }
      setErr(res?.code || 'DATABASE_ERROR');
      setPending(false);
    } catch (e: any) {
      setErr(e?.message || 'DATABASE_ERROR');
      setPending(false);
    }
  };

  const showImage = !!variant.image && !imageFailed;
  const isLongLabel = variant.label.length > 12;

  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: 18 }}>
        {COPY.stage1Helper}
      </p>

      <button
        onClick={doCheckIn}
        disabled={busy}
        style={{
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f43f5e, #fb7185)',
          color: '#fff',
          border: 'none',
          cursor: busy ? 'not-allowed' : 'pointer',
          padding: 16,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: busy ? 'none' : 'breathe 3s infinite ease-in-out',
          transition: 'transform 0.2s',
          margin: '0 auto',
        }}
      >
        <span
          style={{
            fontSize: isLongLabel ? 'clamp(14px, 4vw, 22px)' : 26,
            fontWeight: 700,
            lineHeight: 1.25,
            textWrap: 'balance',
            overflowWrap: 'anywhere',
            display: 'block',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {showImage ? (
            <img
              src={zao}
              alt="早安图"
              onError={() => setImageFailed(true)}
              style={{ maxWidth: 140, maxHeight: 92, display: 'block', margin: '0 auto 12px', borderRadius: 8 }}
            />
          ) : null}
          {variant.label}
        </span>
      </button>

      <div style={{ minHeight: 40, marginTop: 24 }}>
        {award !== null && (
          <p aria-live="polite" style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', animation: 'slide-up 0.3s ease-out' }}>
            {formatAward(award)}
          </p>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <button className="btn-ghost" onClick={() => { setErr(null); setShowMeow(true); }} disabled={busy}>
          {COPY.notHavingGoodMorning}
        </button>
      </div>

      <Modal open={showMeow} onClose={() => setShowMeow(false)} label={COPY.meowBlessing} dismissible={!pending}>
        <div style={{ textAlign: 'center' }}>
          <img src={meow} alt="meowmeow" style={{ maxWidth: 260, borderRadius: 16, marginBottom: 16 }} />
          <h3 style={{ marginBottom: 24 }}>{COPY.meowBlessing}</h3>

          {award !== null ? (
            <p aria-live="polite" style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
              {formatAward(award)}
            </p>
          ) : (
            <button className="btn-primary" style={{ padding: '12px 32px', fontSize: 18 }} onClick={doCheckIn} disabled={busy}>
              {COPY.yay}
            </button>
          )}

          <div style={{ minHeight: 24, marginTop: 16 }}>
            {pending && <p aria-live="polite" style={{ color: 'var(--text-muted)' }}>...</p>}
            {err && (
              <p style={{ color: 'var(--danger)', fontWeight: 600 }} role="alert">
                {err}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
