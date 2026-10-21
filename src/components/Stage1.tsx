import { useState } from 'react';
import { COPY, pickOne, STAGE1_BUTTONS } from '../content/copy';
import { supabase } from '../lib/supabase';
import { useApp } from '../AppContext';
import meow from '../../meowmeow.png';
import zao from '../../早安图.png';

export function Stage1() {
  const { participantKey, refresh } = useApp();
  const [btnText] = useState(() => pickOne(STAGE1_BUTTONS));
  const [showMeow, setShowMeow] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const doCheckIn = async () => {
    if (!participantKey || pending) return;
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
        await refresh();
        setPending(false);
        setShowMeow(false);
        return;
      }
      if (res?.ok) {
        setResult(res);
        await refresh();
        setPending(false);
        setShowMeow(false);
        return;
      }
      setErr(res?.code || 'DATABASE_ERROR');
      setPending(false);
    } catch (e: any) {
      setErr(e?.message || 'DATABASE_ERROR');
      setPending(false);
    }
  };

  const isImageBtn = btnText === '早上好中国，现在我有冰淇淋，我很喜欢冰淇淋';

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'system-ui', textAlign: 'center', padding: 16 }}>
      <p>{COPY.stage1Helper}</p>
      <button
        onClick={doCheckIn}
        disabled={pending}
        style={{ width: 220, height: 220, borderRadius: '50%', background: 'crimson', color: '#fff', fontSize: isImageBtn ? 14 : 22, border: 'none', cursor: pending ? 'not-allowed' : 'pointer', padding: 12 }}
      >
        {isImageBtn ? (
          <div>
            <img src={zao} alt="zao" style={{ maxWidth: 140, maxHeight: 90, display: 'block', margin: '0 auto 6px' }} onError={(e) => { (e.currentTarget as any).style.display = 'none'; }} />
            <div style={{ fontSize: 'clamp(10px, 2vw, 14px)', wordBreak: 'break-word' }}>{btnText}</div>
          </div>
        ) : (
          <div style={{ fontSize: btnText.length > 12 ? 'clamp(14px, 4vw, 20px)' : 22 }}>{btnText}</div>
        )}
      </button>
      {result && <p>{result.wake_points === 0 ? '0 pts — late' : result.wake_points + ' pts'}</p>}
      <div style={{ marginTop: 20 }}>
        <button onClick={() => { setShowMeow(true); setErr(null); }} disabled={pending}>{COPY.notHavingGoodMorning}</button>
      </div>

      {showMeow && (
        <dialog open style={{ border: 'none', borderRadius: 8, padding: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <img src={meow} alt="meowmeow" style={{ maxWidth: 260 }} />
            <p>{COPY.meowBlessing}</p>
            <button onClick={doCheckIn} disabled={pending}>{COPY.yay}</button>
            {err && <p style={{ color: 'crimson' }}>{err}</p>}
            {pending && <p>...</p>}
          </div>
        </dialog>
      )}
    </div>
  );
}
