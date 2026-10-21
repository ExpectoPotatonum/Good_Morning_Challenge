import { useApp } from './useApp';
import { UsernamePicker } from './components/UsernamePicker';
import { Stage1 } from './components/Stage1';
import { Stage2 } from './components/Stage2';
import { Stage3 } from './components/Stage3';
import { Scoreboard } from './components/Scoreboard';
import { SharedActions } from './components/SharedActions';
import { COPY } from './content/copy';
import { CHALLENGE_UTC_LABEL } from './utils/format';

function Main() {
  const { participantKey, setParticipantKey, dashboard, loading, refresh } = useApp();

  if (!participantKey) return <UsernamePicker />;

  if (dashboard?.error === 'UNKNOWN_PARTICIPANT') {
    return (
      <div style={{ padding: 24, maxWidth: 420, margin: '40px auto', fontFamily: 'system-ui' }}>
        <p>Unknown participant</p>
        <button onClick={() => setParticipantKey(null)}>Back to picker</button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div style={{ padding: 24, maxWidth: 420, margin: '40px auto', fontFamily: 'system-ui' }}>
        <p aria-live="polite">{loading ? 'Loading…' : 'No data yet.'}</p>
      </div>
    );
  }

  const participants = dashboard.participants ?? [];
  const history = dashboard.history ?? [];
  const serverDate = dashboard.server_challenge_date;
  const status = dashboard.challenge?.status;
  const selected = dashboard.selected ?? { participant_key: participantKey, display_name: participantKey };
  const self = participants.find((p) => p.participant_key === participantKey);

  const switchPlayer = (
    <div style={{ textAlign: 'right', padding: 12 }}>
      <button onClick={() => setParticipantKey(null)}>{COPY.switchPlayer}</button>
    </div>
  );

  if (status === 'over') {
    return (
      <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
        {switchPlayer}
        <h1>{COPY.challengeOver}</h1>
        <Scoreboard participants={participants} />
        <SharedActions history={history} serverDate={serverDate} />
        <div style={{ marginTop: 12 }}>
          <button onClick={() => refresh()}>Refresh</button>
        </div>
      </div>
    );
  }

  if (status === 'before') {
    return (
      <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
        {switchPlayer}
        <h1>{COPY.challengeNotStarted}</h1>
        <p>
          21–31 October 2026 · {CHALLENGE_UTC_LABEL}
        </p>
        <SharedActions history={history} serverDate={serverDate} />
      </div>
    );
  }

  // Stage 1 — not checked in today: only the check-in experience is shown.
  if (!self?.today.has_record) {
    return (
      <div>
        {switchPlayer}
        <Stage1 />
      </div>
    );
  }

  // Stage 3 — a sleep-back penalty was already confirmed for this participant.
  if (self.today.sleep_back_at) {
    return (
      <div>
        {switchPlayer}
        <Stage3 participants={participants} history={history} serverDate={serverDate} />
      </div>
    );
  }

  // Stage 2 — shared content plus this participant's status and sleep-back prompt.
  return (
    <div>
      {switchPlayer}
      <Stage2 participants={participants} selected={selected} history={history} serverDate={serverDate} />
    </div>
  );
}

export default Main;
