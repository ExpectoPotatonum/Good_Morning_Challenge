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
    <div
      style={{
        maxWidth: 520,
        margin: '40px auto',
        fontFamily: 'system-ui',
        textAlign: 'center',
        padding: 16,
      }}
    >
      <p>{COPY.stage1Helper}</p>

      <button
        onClick={doCheckIn}
        disabled={busy}
        style={{
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'crimson',
          color: '#fff',
          border: 'none',
          cursor: busy ? 'not-allowed' : 'pointer',
          padding: 12,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: isLongLabel ? 'clamp(13px, 3.5vw, 20px)' : 22,
            lineHeight: 1.25,
            textWrap: 'balance',
            overflowWrap: 'anywhere',
            display: 'block',
          }}
        >
          {showImage ? (
            <img
              src={zao}
              alt="早安图"
              onError={() => setImageFailed(true)}
              style={{ maxWidth: 140, maxHeight: 92, display: 'block', margin: '0 auto 6px' }}
            />
          ) : null}
          {variant.label}
        </span>
      </button>

      {award !== null && (
        <p aria-live="polite" style={{ marginTop: 12, fontSize: 20 }}>
          {formatAward(award)}
        </p>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => { setErr(null); setShowMeow(true); }} disabled={busy}>
          {COPY.notHavingGoodMorning}
        </button>
      </div>

      <Modal open={showMeow} onClose={() => setShowMeow(false)} label={COPY.meowBlessing} dismissible={!pending}>
        <div style={{ textAlign: 'center' }}>
          <img src={meow} alt="meowmeow" style={{ maxWidth: 260 }} />
          <p>{COPY.meowBlessing}</p>
          {award !== null ? (
            <p aria-live="polite" style={{ fontSize: 18 }}>
              {formatAward(award)}
            </p>
          ) : (
            <button onClick={doCheckIn} disabled={busy}>
              {COPY.yay}
            </button>
          )}
          {pending && <p aria-live="polite">...</p>}
          {err && (
            <p style={{ color: 'crimson' }} role="alert">
              {err}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
