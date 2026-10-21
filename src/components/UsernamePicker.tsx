import { useState } from 'react';
import { useApp } from '../AppContext';
import { COPY } from '../content/copy';

export function UsernamePicker() {
  const { setParticipantKey } = useApp();
  const [err, setErr] = useState<string | null>(null);

  const pick = (k: string) => {
    setErr(null);
    setParticipantKey(k);
  };

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Wake-Up Challenge</h1>
      <p>Select a participant</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => pick('player_1')}>Player 1</button>
        <button onClick={() => pick('player_2')}>Player 2</button>
      </div>
      <p style={{ color: '#666', marginTop: 16 }}>{COPY.switchPlayer} - remember selection in localStorage</p>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
    </div>
  );
}
