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

  // Persistent header: the challenge title on the left, Switch player on the
  // right once a participant is selected. Rendered in every stage.
  const header = (
    <header className="app-header">
      <h1 className="app-title">{COPY.appTitle}</h1>
      {participantKey ? (
        <button className="btn-ghost app-switch" onClick={() => setParticipantKey(null)}>{COPY.switchPlayer}</button>
      ) : null}
    </header>
  );

  if (!participantKey) {
    return (
      <div className="app-container">
        {header}
        <UsernamePicker />
      </div>
    );
  }

  if (dashboard?.error === 'UNKNOWN_PARTICIPANT') {
    return (
      <div className="app-container">
        {header}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p>{COPY.unknownParticipant}</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setParticipantKey(null)}>{COPY.backToPicker}</button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="app-container">
        {header}
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p aria-live="polite">{loading ? COPY.loading : COPY.noDataYet}</p>
        </div>
      </div>
    );
  }

  const participants = dashboard.participants ?? [];
  const history = dashboard.history ?? [];
  const serverDate = dashboard.server_challenge_date;
  const status = dashboard.challenge?.status;
  const selected = dashboard.selected ?? { participant_key: participantKey, display_name: participantKey };
  const self = participants.find((p) => p.participant_key === participantKey);

  if (status === 'over') {
    return (
      <div className="app-container">
        {header}
        <div className="glass-card">
          <h1 style={{ textAlign: 'center' }}>{COPY.challengeOver}</h1>
          <Scoreboard participants={participants} />
          <SharedActions history={history} serverDate={serverDate} />
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button className="btn-ghost" onClick={() => refresh()}>{COPY.refresh}</button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'before') {
    return (
      <div className="app-container">
        {header}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h1>{COPY.challengeNotStarted}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
            {COPY.challengeDates} · {CHALLENGE_UTC_LABEL}
          </p>
          <SharedActions history={history} serverDate={serverDate} />
        </div>
      </div>
    );
  }

  // Stage 1 — not checked in today: only the check-in experience is shown.
  if (!self?.today.has_record) {
    return (
      <div className="app-container">
        {header}
        <Stage1 />
      </div>
    );
  }

  // Stage 3 — a sleep-back penalty was already confirmed for this participant.
  if (self.today.sleep_back_at) {
    return (
      <div className="app-container">
        {header}
        <Stage3 participants={participants} history={history} serverDate={serverDate} />
      </div>
    );
  }

  // Stage 2 — shared content plus this participant's status and sleep-back prompt.
  return (
    <div className="app-container">
      {header}
      <Stage2 participants={participants} selected={selected} history={history} serverDate={serverDate} />
    </div>
  );
}

export default Main;
