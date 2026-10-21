# Dawn & Dusk — UI design reference

This is the user-supplied redesign that the current interface implements: the
"Dawn & Dusk" theme (animated sunrise/twilight gradient, glassmorphism cards,
pulsing Stage 1 button) plus the full source of every restyled file. Applied on
2026-10-21. `ARCHITECTURE.MD` remains the behavioural source of truth.

---

Here is a complete, beautifully modernized UI redesign of the application. 

### Design Concept: "Dawn & Dusk"
- **Theme:** A rich, animated gradient background that shifts beautifully between soft morning hues (Light Mode: peach/sunrise) and deep night shades (Dark Mode: twilight/midnight).
- **Glassmorphism:** Cards and modals now use semi-transparent frosted glass effects (`backdrop-filter: blur`) to look layered and modern.
- **Interactions:** Smooth hovering, active states (subtle scale-down on click), and a pulsing, breathing animation for the giant Stage 1 "Good Morning" check-in button to make it intensely clickable.
- **Constraints Maintained:** **Zero** logic was altered. All state hooks, logic chains, strings (`COPY`), check-in workflows, and exact text-node rendering (especially for the scoreboard/status lines) remain strictly untouched to ensure tests will pass.

Here are the completely restyled files. Simply replace your existing files with these.

---

### `src/index.css`

```css
:root {
  /* Light Mode (Dawn) */
  --text: #334155;
  --text-h: #0f172a;
  --text-muted: #64748b;
  --bg-gradient: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  --card-bg: rgba(255, 255, 255, 0.65);
  --card-border: rgba(255, 255, 255, 0.8);
  --border: #e2e8f0;
  --primary: #f43f5e;
  --primary-hover: #e11d48;
  --danger: #dc2626;
  --danger-hover: #b91c1c;
  --shadow: rgba(0, 0, 0, 0.08);

  --sans: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --heading: 'Inter', var(--sans);
  
  font: 16px/1.6 var(--sans);
  letter-spacing: 0.2px;
  color-scheme: light dark;
  color: var(--text);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Mode (Midnight) */
    --text: #cbd5e1;
    --text-h: #f8fafc;
    --text-muted: #94a3b8;
    --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    --card-bg: rgba(30, 41, 59, 0.45);
    --card-border: rgba(255, 255, 255, 0.1);
    --border: #334155;
    --primary: #fb7185;
    --primary-hover: #f43f5e;
    --danger: #ef4444;
    --danger-hover: #dc2626;
    --shadow: rgba(0, 0, 0, 0.25);
  }
}

body {
  margin: 0;
  background: var(--bg-gradient);
  background-attachment: fixed;
  min-height: 100svh;
}

#root {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Typography */
h1, h2, h3, h4 {
  font-family: var(--heading);
  font-weight: 700;
  color: var(--text-h);
  margin-top: 0;
}

h1 {
  font-size: clamp(32px, 5vw, 48px);
  letter-spacing: -1.5px;
  line-height: 1.1;
  margin-bottom: 24px;
}

h2 {
  font-size: clamp(22px, 4vw, 28px);
  letter-spacing: -0.5px;
  margin-bottom: 16px;
}

h3 {
  font-size: 20px;
  margin-bottom: 12px;
}

p {
  margin: 0 0 12px;
}
p:last-child {
  margin-bottom: 0;
}

/* Layout Utilities */
.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  animation: fade-in 0.6s ease-out forwards;
}

.glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  box-shadow: 0 12px 40px var(--shadow);
  padding: 32px;
  margin-top: 20px;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
}

/* Buttons */
button {
  font: inherit;
  font-weight: 500;
  padding: 10px 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: transparent;
  color: var(--text-h);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--text-muted);
  transform: translateY(-2px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none !important;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: 0 6px 16px rgba(244, 63, 94, 0.4);
}

.btn-danger {
  background: var(--danger);
  color: #fff;
  border: none;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: var(--danger-hover);
}

.btn-ghost {
  border-color: transparent;
  background: transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  font-size: 14px;
}

.data-table th, .data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--card-border);
}

.data-table th {
  font-weight: 600;
  color: var(--text-h);
  background: rgba(0, 0, 0, 0.03);
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Dialog */
.glass-dialog {
  background: var(--card-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
  padding: 32px;
  max-width: 480px;
  width: 90%;
  color: var(--text);
  max-height: 85vh;
  overflow-y: auto;
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  animation: fade-in 0.3s ease-out forwards;
}

/* Animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes breathe {
  0% { box-shadow: 0 0 20px rgba(244, 63, 94, 0.4), inset 0 0 20px rgba(255,255,255,0.2); transform: scale(1); }
  50% { box-shadow: 0 0 60px rgba(244, 63, 94, 0.8), inset 0 0 10px rgba(255,255,255,0.1); transform: scale(1.03); }
  100% { box-shadow: 0 0 20px rgba(244, 63, 94, 0.4), inset 0 0 20px rgba(255,255,255,0.2); transform: scale(1); }
}
```

---

### `src/App.tsx`

```tsx
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
      <div className="app-container">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p>Unknown participant</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setParticipantKey(null)}>Back to picker</button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="app-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p aria-live="polite">{loading ? 'Loading…' : 'No data yet.'}</p>
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

  const switchPlayer = (
    <div className="top-bar">
      <button className="btn-ghost" onClick={() => setParticipantKey(null)}>{COPY.switchPlayer}</button>
    </div>
  );

  if (status === 'over') {
    return (
      <div className="app-container">
        {switchPlayer}
        <div className="glass-card">
          <h1 style={{ textAlign: 'center' }}>{COPY.challengeOver}</h1>
          <Scoreboard participants={participants} />
          <SharedActions history={history} serverDate={serverDate} />
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button className="btn-ghost" onClick={() => refresh()}>Refresh</button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'before') {
    return (
      <div className="app-container">
        {switchPlayer}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h1>{COPY.challengeNotStarted}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
            21–31 October 2026 · {CHALLENGE_UTC_LABEL}
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
        {switchPlayer}
        <Stage1 />
      </div>
    );
  }

  // Stage 3 — a sleep-back penalty was already confirmed for this participant.
  if (self.today.sleep_back_at) {
    return (
      <div className="app-container">
        {switchPlayer}
        <Stage3 participants={participants} history={history} serverDate={serverDate} />
      </div>
    );
  }

  // Stage 2 — shared content plus this participant's status and sleep-back prompt.
  return (
    <div className="app-container">
      {switchPlayer}
      <Stage2 participants={participants} selected={selected} history={history} serverDate={serverDate} />
    </div>
  );
}

export default Main;
```

---

### `src/components/UsernamePicker.tsx`

```tsx
import { COPY, PARTICIPANTS } from '../content/copy';
import { useApp } from '../useApp';

export function UsernamePicker() {
  const { setParticipantKey } = useApp();

  return (
    <div className="app-container" style={{ justifyContent: 'center' }}>
      <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h1 style={{ marginBottom: 8 }}>Wake-Up Challenge</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>{COPY.pickPlayer}</p>
        
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PARTICIPANTS.map((p) => (
            <button 
              key={p.key} 
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: '18px', borderRadius: '16px' }}
              onClick={() => setParticipantKey(p.key)}
            >
              {p.displayName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### `src/components/Stage1.tsx`

```tsx
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
  const [variant] = useState(() => pickOne(STAGE1_BUTTONS));
  const [imageFailed, setImageFailed] = useState(false);
  const [showMeow, setShowMeow] = useState(false);
  const [pending, setPending] = useState(false);
  const [award, setAward] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const busy = pending || award !== null;

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
        await refresh();
        setPending(false);
        setShowMeow(false);
        return;
      }
      if (res?.ok) {
        setAward(typeof res.wake_points === 'number' ? res.wake_points : 0);
        setPending(false);
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
          margin: '0 auto'
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
            textShadow: '0 2px 8px rgba(0,0,0,0.2)'
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
```

---

### `src/components/Stage2.tsx`

```tsx
import { useState } from 'react';
import { COPY, pickOne, SLEEP_BACK_TITLES } from '../content/copy';
import { supabase } from '../lib/supabase';
import { useApp } from '../useApp';
import { Modal } from './Modal';
import { Scoreboard } from './Scoreboard';
import { SharedActions } from './SharedActions';
import { formatChallengeTimestamp, formatPoints } from '../utils/format';
import type { DashboardHistoryDate, DashboardParticipant } from '../types';

export function Stage2({
  participants,
  selected,
  history,
  serverDate,
}: {
  participants: DashboardParticipant[];
  selected: { participant_key: string; display_name: string };
  history: DashboardHistoryDate[];
  serverDate?: string;
}) {
  const { refresh } = useApp();
  const self = participants.find((p) => p.participant_key === selected.participant_key);
  const [showSleep, setShowSleep] = useState(false);
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasSleepBack = !!self?.today.sleep_back_at;
  const hasRecord = !!self?.today.has_record;

  const openSleepModal = () => {
    setTitle(pickOne(SLEEP_BACK_TITLES));
    setErr(null);
    setShowSleep(true);
  };

  const doSleepBack = async () => {
    if (!selected.participant_key || pending || hasSleepBack) return;
    setPending(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc('mark_sleep_back_today', {
        p_participant_key: selected.participant_key,
      });
      if (error) {
        setErr(error.message || 'DATABASE_ERROR');
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
    } catch (e: any) {
      setErr(e?.message || 'DATABASE_ERROR');
      setPending(false);
    }
  };

  const when =
    self?.today.entry_source === 'day_one_seed'
      ? COPY.initialReportLabel
      : formatChallengeTimestamp(self?.today.checked_in_at);

  return (
    <div className="glass-card">
      <Scoreboard participants={participants}>
        {self && hasRecord && (
          <div style={{ 
            background: 'rgba(0,0,0,0.03)', 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 24,
            border: '1px solid var(--card-border)'
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
              {COPY.youCheckedInTodayAt} {when}
            </div>
            <div style={{ fontSize: 18, marginBottom: 4 }}>
              {COPY.wakePointsLine} {formatPoints(self.today.wake_points)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-h)' }}>
              {COPY.totalScore} {formatPoints(self.cumulative_points)}
            </div>
          </div>
        )}
      </Scoreboard>

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <SharedActions history={history} serverDate={serverDate}>
          {self && hasRecord && !hasSleepBack && (
            <button className="btn-danger" onClick={openSleepModal} style={{ width: '100%', padding: 14, fontSize: 16, marginBottom: 16 }}>
              {COPY.sleepBackButton}
            </button>
          )}
        </SharedActions>
      </div>

      <Modal
        open={showSleep}
        onClose={() => setShowSleep(false)}
        label={COPY.didYouSleepBack}
        dismissible={!pending}
      >
        <h3 style={{ fontSize: 24, color: 'var(--danger)', marginBottom: 24 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
          <button className="btn-ghost" onClick={() => setShowSleep(false)} disabled={pending}>
            {COPY.sleepBackNah}
          </button>
          <button
            className="btn-danger"
            onClick={doSleepBack}
            disabled={pending}
          >
            {COPY.sleepBackYea}
          </button>
        </div>
        <div style={{ minHeight: 24, marginTop: 16, textAlign: 'right' }}>
          {pending && <p aria-live="polite" style={{ color: 'var(--text-muted)' }}>...</p>}
          {err && (
            <p style={{ color: 'var(--danger)', fontWeight: 600 }} role="alert">
              {err}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
```

---

### `src/components/Stage3.tsx`

```tsx
import { Scoreboard } from './Scoreboard';
import { SharedActions } from './SharedActions';
import type { DashboardHistoryDate, DashboardParticipant } from '../types';

export function Stage3({
  participants,
  history,
  serverDate,
}: {
  participants: DashboardParticipant[];
  history: DashboardHistoryDate[];
  serverDate?: string;
}) {
  return (
    <div className="glass-card">
      <Scoreboard participants={participants} />
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <SharedActions history={history} serverDate={serverDate} />
      </div>
    </div>
  );
}
```

---

### `src/components/Scoreboard.tsx`

```tsx
import type { ReactNode } from 'react';
import { COPY } from '../content/copy';
import { formatRecordSummary } from '../utils/format';
import type { DashboardParticipant } from '../types';

export function Scoreboard({
  participants,
  children,
}: {
  participants: DashboardParticipant[];
  children?: ReactNode;
}) {
  return (
    <section>
      <h2 style={{ marginBottom: 24 }}>{COPY.scoreboard}</h2>
      {children}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {participants.map((p) => (
          <div key={p.participant_key} style={{ 
            padding: 16, 
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 16,
            border: '1px solid var(--card-border)'
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-h)', marginBottom: 4 }}>
              {`${p.display_name} ${COPY.totalPts} ${p.cumulative_points}`}
            </div>
            <div style={{ fontSize: 14, color: p.today.has_record ? 'var(--text)' : 'var(--text-muted)' }}>
              {`${COPY.today} ${formatRecordSummary(p)}`}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

### `src/components/SharedActions.tsx`

```tsx
import { useState, type ReactNode } from 'react';
import { COPY } from '../content/copy';
import { HistoryModal } from './HistoryModal';
import { RulesModal } from './RulesModal';
import type { DashboardHistoryDate } from '../types';

export function SharedActions({
  history,
  serverDate,
  children,
}: {
  history: DashboardHistoryDate[];
  serverDate?: string;
  children?: ReactNode;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{ flex: 1 }} onClick={() => setShowRules(true)}>{COPY.rulesButton}</button>
          <button style={{ flex: 1 }} onClick={() => setShowHistory(true)}>{COPY.viewHistoryButton}</button>
        </div>
      </section>
      
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />
      
      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        serverDate={serverDate}
      />
    </>
  );
}
```

---

### `src/components/Modal.tsx`

```tsx
import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  dismissible?: boolean;
  children: ReactNode;
};

export function Modal({ open, onClose, label, dismissible = true, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === 'function') {
        try {
          el.showModal();
        } catch {
          el.setAttribute('open', '');
        }
      } else {
        el.setAttribute('open', '');
      }
    } else if (!open && el.open) {
      if (typeof el.close === 'function') {
        el.close();
      } else {
        el.removeAttribute('open');
      }
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancelEvent = (event: Event) => {
      if (!dismissible) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancelEvent);
    return () => el.removeEventListener('cancel', onCancelEvent);
  }, [dismissible, onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(event) => {
        if (event.target === ref.current && dismissible) onClose();
      }}
      className="glass-dialog"
      style={{
        border: '1px solid var(--card-border)',
        margin: 'auto',
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
```

---

### `src/components/RulesModal.tsx`

```tsx
import { Modal } from './Modal';
import { COPY, RULES_BULLETS, WAKE_POINT_TABLE } from '../content/copy';
import { CHALLENGE_UTC_LABEL } from '../utils/format';

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label={COPY.rules}>
      <h3 style={{ marginBottom: 24, fontSize: 24 }}>Rules</h3>
      
      <ul style={{ textAlign: 'left', paddingLeft: 20, marginBottom: 32, gap: 8, display: 'flex', flexDirection: 'column' }}>
        {RULES_BULLETS.map((line) => (
          <li key={line} style={{ color: 'var(--text)', lineHeight: 1.5 }}>{line}</li>
        ))}
      </ul>
      
      <h4 style={{ fontSize: 18, marginBottom: 16 }}>Wake points</h4>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--card-border)' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Local time ({CHALLENGE_UTC_LABEL})</th>
              <th style={{ textAlign: 'center' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {WAKE_POINT_TABLE.map((row) => (
              <tr key={row.window}>
                <td>{row.window}</td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
        The 5-point cap applies to every earlier time, including before 06:01.
      </p>
      
      <div style={{ textAlign: 'right', marginTop: 32 }}>
        <button className="btn-primary" onClick={onClose}>{COPY.close}</button>
      </div>
    </Modal>
  );
}
```

---

### `src/components/HistoryModal.tsx`

```tsx
import { Modal } from './Modal';
import { COPY } from '../content/copy';
import { formatChallengeDate, formatChallengeTimestamp, formatPoints, isFutureDate } from '../utils/format';
import type { DashboardHistoryDate } from '../types';

export function HistoryModal({
  open,
  onClose,
  history,
  serverDate,
}: {
  open: boolean;
  onClose: () => void;
  history: DashboardHistoryDate[];
  serverDate?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} label={COPY.viewHistory}>
      <h3 style={{ marginBottom: 24, fontSize: 24 }}>{COPY.viewHistory}</h3>
      
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--card-border)' }}>
        <table className="data-table" style={{ margin: 0, minWidth: 600 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Player</th>
              <th>Check in</th>
              <th style={{ textAlign: 'center' }}>Wake</th>
              <th style={{ textAlign: 'center' }}>Sleep back</th>
              <th style={{ textAlign: 'center' }}>Net</th>
            </tr>
          </thead>
          <tbody>
            {history.map((dateRow) => {
              const future = isFutureDate(dateRow.date, serverDate);
              return dateRow.rows.map((row, index) => (
                <tr key={`${dateRow.date}-${row.participant_key}`}>
                  {index === 0 ? (
                    <td rowSpan={dateRow.rows.length} style={{ whiteSpace: 'nowrap', verticalAlign: 'top', borderRight: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.01)' }}>
                      <span style={{ fontWeight: 600 }}>{formatChallengeDate(dateRow.date)}</span>
                    </td>
                  ) : null}
                  <td style={{ fontWeight: 500, color: 'var(--text-h)' }}>{row.display_name}</td>
                  <td style={{ color: future || !row.record ? 'var(--text-muted)' : 'var(--text)' }}>
                    {future ? (
                      COPY.futureDash
                    ) : row.record ? (
                      row.record.entry_source === 'day_one_seed' ? (
                        COPY.initialReportLabel
                      ) : (
                        formatChallengeTimestamp(row.record.checked_in_at)
                      )
                    ) : (
                      COPY.notCheckedIn
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {future ? COPY.futureDash : row.record ? formatPoints(row.record.wake_points) : COPY.futureDash}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {future
                      ? COPY.futureDash
                      : row.record
                        ? row.record.sleep_back_at
                          ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{COPY.sleepBack}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>{COPY.noSleepBack}</span>
                        : COPY.futureDash}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-h)' }}>
                    {future ? COPY.futureDash : row.record ? row.record.daily_net : COPY.futureDash}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
      
      <div style={{ textAlign: 'right', marginTop: 32 }}>
        <button className="btn-primary" onClick={onClose}>{COPY.close}</button>
      </div>
    </Modal>
  );
}
```