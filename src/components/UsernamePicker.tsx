import { COPY, PARTICIPANTS } from '../content/copy';
import { useApp } from '../useApp';

export function UsernamePicker() {
  const { setParticipantKey } = useApp();

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Wake-Up Challenge</h1>
      <p>{COPY.pickPlayer}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {PARTICIPANTS.map((p) => (
          <button key={p.key} onClick={() => setParticipantKey(p.key)}>
            {p.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
