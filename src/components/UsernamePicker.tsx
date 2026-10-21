import { COPY, PARTICIPANTS } from '../content/copy';
import { useApp } from '../useApp';

export function UsernamePicker() {
  const { setParticipantKey } = useApp();

  return (
    <div
      className="glass-card"
      style={{ textAlign: 'center', padding: '40px 24px', marginTop: 'auto', marginBottom: 'auto' }}
    >
      <p
        style={{
          color: 'var(--text-h)',
          fontSize: 'clamp(26px, 7vw, 34px)',
          fontWeight: 800,
          letterSpacing: '-1px',
          lineHeight: 1.1,
          marginBottom: 32,
        }}
      >
        {COPY.pickPlayer}
      </p>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        {PARTICIPANTS.map((p) => (
          <button
            key={p.key}
            className="btn-primary"
            style={{ flex: 1, maxWidth: 160, padding: '16px 0', fontSize: '18px', borderRadius: '16px' }}
            onClick={() => setParticipantKey(p.key)}
          >
            {p.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
