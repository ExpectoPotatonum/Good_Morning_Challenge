import { useApp } from './AppContext';
import { UsernamePicker } from './components/UsernamePicker';
import { Stage1 } from './components/Stage1';
import { Stage2 } from './components/Stage2';
import { Stage3 } from './components/Stage3';
import { COPY } from './content/copy';

function Main() {
  const { participantKey, setParticipantKey, dashboard, refresh } = useApp();

  if (!participantKey) return <UsernamePicker />;

  if (dashboard?.error === 'UNKNOWN_PARTICIPANT') {
    return (
      <div style={{ padding: 24, maxWidth: 420, margin: '40px auto' }}>
        <p>Unknown participant</p>
        <button onClick={() => setParticipantKey(null)}>Back to picker</button>
      </div>
    );
  }

  const status = dashboard?.challenge?.status;
  if (status === 'over') {
    return (
      <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
        <h1>{COPY.challengeOver}</h1>
        <section>
          {dashboard?.participants?.map((p) => (
            <div key={p.participant_key}>{p.display_name}: {p.cumulative_points}</div>
          ))}
        </section>
        <section style={{ marginTop: 12 }}>
          <button onClick={() => refresh()}>Refresh</button>
          <button style={{ marginLeft: 8 }} onClick={() => setParticipantKey(null)}>{COPY.switchPlayer}</button>
        </section>
      </div>
    );
  }

  const participants = dashboard?.participants || [];
  const selected = dashboard?.selected || { participant_key: participantKey, display_name: participantKey };
  const self = participants.find((p) => p.participant_key === participantKey);

  if (!self?.today.has_record) {
    return (
      <div>
        <div style={{ textAlign: 'right', padding: 12 }}>
          <button onClick={() => setParticipantKey(null)}>{COPY.switchPlayer}</button>
        </div>
        <Stage1 />
      </div>
    );
  }

  if (self.today.sleep_back_at) {
    return (
      <div>
        <div style={{ textAlign: 'right', padding: 12 }}>
          <button onClick={() => setParticipantKey(null)}>{COPY.switchPlayer}</button>
        </div>
        <Stage3 participants={participants} selected={selected} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'right', padding: 12 }}>
        <button onClick={() => setParticipantKey(null)}>{COPY.switchPlayer}</button>
      </div>
      <Stage2 participants={participants} selected={selected} />
    </div>
  );
}

export default Main;
