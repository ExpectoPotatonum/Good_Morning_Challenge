# UI Codebase Dump — Wake-Up Challenge

Generated on 2026-10-21 from commit `bf63a56`.

Every block below is the **complete, unmodified content** of the file named in
its `///path///` header. Nothing is elided, so this file is a faithful
snapshot of the UI layer you can read, copy and redesign from in one place.

**How to use this:** the UI is plain React with inline `style={{ ... }}` objects
and a single global stylesheet (`src/index.css`). There is no CSS framework
and no component library — restyling means editing the `style` props in the
components and/or rewriting `src/index.css`.

**Be careful not to break the behaviour while restyling:**

- The main `GOOD MOANING` button and the modal `yay` button must keep calling
  the **same** check-in action (`doCheckIn`).
- Every UI string lives in `src/content/copy.ts`. Change text there, not inline.
- Modals must stay open while a write is pending, must disable repeat
  submissions, and must show failures inside the modal.
- Points must only update after the server confirms the write.
- The scoreboard and status lines must stay a **single text node per line**
  (the UI tests read direct text children, so avoid splitting a line into
  nested `<strong>`/`<span>` elements).

---

## Contents

- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/app-context.ts`
- `src/AppContext.tsx`
- `src/useApp.ts`
- `src/types.ts`
- `src/lib/supabase.ts`
- `src/content/copy.ts`
- `src/utils/format.ts`
- `src/utils/scoring.ts`
- `src/components/UsernamePicker.tsx`
- `src/components/Stage1.tsx`
- `src/components/Stage2.tsx`
- `src/components/Stage3.tsx`
- `src/components/Scoreboard.tsx`
- `src/components/SharedActions.tsx`
- `src/components/Modal.tsx`
- `src/components/RulesModal.tsx`
- `src/components/HistoryModal.tsx`

## Not included (unused Vite template leftovers)

These files exist in the repository but are imported nowhere, so they are not
part of the running UI. Delete them if you are reorganising:

- `src/App.css`
- `src/assets/hero.png`
- `src/assets/react.svg`
- `src/assets/vite.svg`

---

///index.html///

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wake-Up Challenge</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

///src/main.tsx///

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './AppContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
```

---

///src/App.tsx///

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
```

---

///src/index.css///

```css
:root {
  --text: #6b6375;
  --text-h: #08060d;
  --bg: #fff;
  --border: #e5e4e7;

  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;

  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;
  color-scheme: light dark;
  color: var(--text);
  background: var(--bg);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  @media (max-width: 1024px) {
    font-size: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --text: #9ca3af;
    --text-h: #f3f4f6;
    --bg: #16171d;
    --border: #2e303a;
  }
}

body {
  margin: 0;
}

#root {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

h1,
h2 {
  font-family: var(--heading);
  font-weight: 500;
  color: var(--text-h);
}

h1 {
  font-size: 56px;
  letter-spacing: -1.68px;
  margin: 32px 0;
  @media (max-width: 1024px) {
    font-size: 36px;
    margin: 20px 0;
  }
}
h2 {
  font-size: 24px;
  line-height: 118%;
  letter-spacing: -0.24px;
  margin: 0 0 8px;
  @media (max-width: 1024px) {
    font-size: 20px;
  }
}
p {
  margin: 0;
}

button {
  font: inherit;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text-h);
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.35);
}
```

---

///src/app-context.ts///

```ts
import { createContext } from 'react';
import type { DashboardResponse } from './types';

export interface AppCtx {
  participantKey: string | null;
  setParticipantKey: (k: string | null) => void;
  dashboard: DashboardResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const AppContext = createContext<AppCtx>({} as any);
```

---

///src/AppContext.tsx///

```tsx
import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { supabase } from './lib/supabase';
import { AppContext } from './app-context';
import type { DashboardResponse } from './types';

const LS_KEY = 'wmc_participant_key';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [participantKey, setParticipantKeyState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LS_KEY);
    } catch {
      return null;
    }
  });
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const setParticipantKey = useCallback((k: string | null) => {
    try {
      if (k) localStorage.setItem(LS_KEY, k);
      else localStorage.removeItem(LS_KEY);
    } catch {}
    setParticipantKeyState(k);
  }, []);

  const refresh = useCallback(async () => {
    if (!participantKey) {
      setDashboard(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_dashboard', { p_participant_key: participantKey });
      if (error) {
        setDashboard({ error: 'DATABASE_ERROR' } as any);
      } else {
        setDashboard(data as any);
      }
    } catch {
      setDashboard({ error: 'DATABASE_ERROR' } as any);
    } finally {
      setLoading(false);
    }
  }, [participantKey]);

  useEffect(() => {
    // Syncing with an external system (Supabase) on mount / participant change.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Refresh when the tab regains focus so a second device's write is picked up.
  useEffect(() => {
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  return (
    <AppContext.Provider value={{ participantKey, setParticipantKey, dashboard, loading, refresh }}>
      {children}
    </AppContext.Provider>
  );
}
```

---

///src/useApp.ts///

```ts
import { useContext } from 'react';
import { AppContext } from './app-context';

export const useApp = () => useContext(AppContext);
```

---

///src/types.ts///

```ts
export type ChallengeStatus = 'before' | 'active' | 'over';

export interface DashboardToday {
  has_record: boolean;
  entry_source?: 'live' | 'day_one_seed';
  checked_in_at?: string | null;
  reported_wake_window?: string | null;
  wake_points?: number;
  sleep_back_at?: string | null;
  daily_net?: number;
}

export interface DashboardParticipant {
  participant_key: string;
  display_name: string;
  today: DashboardToday;
  cumulative_points: number;
}

export interface DashboardHistoryRowRec {
  participant_key: string;
  display_name: string;
  record: {
    entry_source: 'live' | 'day_one_seed';
    checked_in_at: string | null;
    reported_wake_window: string | null;
    wake_points: number;
    sleep_back_at: string | null;
    daily_net: number;
  } | null;
}

export interface DashboardHistoryDate {
  date: string;
  rows: DashboardHistoryRowRec[];
}

export interface DashboardResponse {
  error?: string;
  server_now?: string;
  server_challenge_date?: string;
  challenge?: {
    id: string;
    name: string;
    starts_on: string;
    ends_on: string;
    timezone: string;
    status: ChallengeStatus;
  };
  selected?: {
    participant_key: string;
    display_name: string;
  };
  participants?: DashboardParticipant[];
  history?: DashboardHistoryDate[];
}
```

---

///src/lib/supabase.ts///

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  console.warn('Missing Supabase env vars');
}

export const supabase = createClient(url || '', key || '');
```

---

///src/content/copy.ts///

```ts
export type Stage = 1 | 2 | 3;

/**
 * The two selectable participants. These must stay in sync with the
 * `challenge_members` rows created by `supabase/migrations/20261021000001_seed_data.sql`
 * (see `20261021000008_participant_names.sql` for the display names).
 * They are public labels, not credentials.
 */
export const PARTICIPANTS: ReadonlyArray<{ key: string; displayName: string }> = [
  { key: 'player_1', displayName: 'Jet' },
  { key: 'player_2', displayName: 'Bingsu' },
];

export type Stage1Variant = {
  label: string;
  /** Optional image-backed variant using an asset already in the repo. */
  image?: 'zao';
};

export const STAGE1_BUTTONS: readonly Stage1Variant[] = [
  { label: 'GOOD MOANING' },
  { label: 'GOOD MEOWING' },
  { label: 'GOOD MORNING' },
  { label: 'good morning' },
  { label: '早上好中国，现在我有冰淇淋，我很喜欢冰淇淋' },
  { label: 'GOOD MORNING', image: 'zao' },
];

export const SLEEP_BACK_TITLES = [
  'Oh no reallyyyy?',
  'oh no reallyyy?',
  'oh SHIT...',
  'NAURRRRRR',
  'oooops',
  'BRUV',
  'hehe ur losing 1 pt',
  'not this time...',
  'TOO TIRED SIA',
  'CMI',
  'today rly tired sia',
] as const;

export const WAKE_POINT_TABLE: ReadonlyArray<{ window: string; points: number }> = [
  { window: '00:00:00 – 06:30:59', points: 5 },
  { window: '06:31:00 – 07:00:59', points: 4 },
  { window: '07:01:00 – 07:30:59', points: 3 },
  { window: '07:31:00 – 08:00:59', points: 2 },
  { window: '08:01:00 – 08:30:59', points: 1 },
  { window: '08:31:00 – 23:59:59', points: 0 },
];

export const RULES_BULLETS: readonly string[] = [
  'Challenge dates: 21–31 October 2026 inclusive.',
  'Official timezone: UTC+8.',
  'The server receives the official check-in time; points are based on that received timestamp.',
  'Late check-in (08:31:00 or later) earns 0 wake points.',
  'A confirmed sleep-back subtracts 1 from cumulative points, at most once per participant per date.',
  'Cumulative scores may be negative.',
  'The 21 October starting entries are initial reports for 08:01–08:30 and do not have exact timestamps.',
];

export const COPY = {
  stage1Helper: 'click below to check in for the day',
  notHavingGoodMorning: 'Not having a good morning? Click me',
  meowBlessing: ':ur blessed by meowmeow, now GOOD MORNING to you',
  yay: 'yay',
  switchPlayer: 'Switch player',
  didYouSleepBack: 'did u slp back?',
  sleepBackButton: 'did u slp back?',
  sleepBackYea: 'Yea ig...',
  sleepBackNah: 'NAH JK i click for fun',
  rules: 'rules',
  rulesButton: 'rules',
  viewHistory: 'view history',
  viewHistoryButton: 'view history',
  challengeOver: 'Challenge over',
  challengeNotStarted: 'Challenge not started yet',
  notCheckedIn: 'Not checked in',
  futureDash: '—',
  initialReportLabel: '08:01–08:30',
  youCheckedInTodayAt: 'You checked in today at:',
  wakePointsLine: 'wake points:',
  totalScore: 'total score:',
  totalPts: 'total pts:',
  today: 'Today:',
  scoreboard: 'Scoreboard',
  wakePoints: 'wake points',
  sleepBack: 'slept back',
  noSleepBack: 'no sleep back',
  pointsSuffix: 'pts',
  lateSuffix: '— late',
  close: 'Close',
  pickPlayer: 'who r u',
} as const;

export function pickOne<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('empty');
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}
```

---

///src/utils/format.ts///

```ts
import { COPY } from '../content/copy';
import type { DashboardParticipant } from '../types';

/** Canonical timezone used for scoring and for every displayed timestamp. */
export const CHALLENGE_TIMEZONE = 'Asia/Kuala_Lumpur';

/**
 * Label shown next to a timestamp. The canonical timezone is a fixed UTC+08:00
 * offset with no daylight saving, so the short label is enough for the UI.
 */
export const CHALLENGE_UTC_LABEL = 'UTC+8';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Format a server timestamp in the canonical challenge timezone.
 * Official scoring never uses the browser clock or browser timezone, so every
 * displayed timestamp is rendered explicitly in the challenge timezone with
 * seconds and a short `UTC+8` label.
 */
export function formatChallengeTimestamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: CHALLENGE_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: CHALLENGE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(d);
  return `${date}, ${time} ${CHALLENGE_UTC_LABEL}`;
}

/** Format a plain `YYYY-MM-DD` challenge date without timezone shifting. */
export function formatChallengeDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** ISO `YYYY-MM-DD` strings sort lexicographically, so plain comparison is safe. */
export function isFutureDate(date: string, serverDate: string | undefined): boolean {
  if (!serverDate) return false;
  return date > serverDate;
}

export function formatPoints(points: number | undefined | null): string {
  if (points === undefined || points === null) return '';
  return `${points} ${points === 1 ? 'pt' : 'pts'}`;
}

/** Award feedback, e.g. `4 pts` or `0 pts — late`. */
export function formatAward(points: number): string {
  return points === 0 ? '0 pts — late' : formatPoints(points);
}

/**
 * Today's record for one participant as a single line of text:
 * `08:01–08:30 — initial report (1 wake points)`.
 *
 * Seeded rows keep their reported window (there is no exact timestamp to
 * show); live rows show the exact server timestamp.
 */
export function formatRecordSummary(participant: DashboardParticipant): string {
  const today = participant.today;
  if (!today.has_record) return COPY.notCheckedIn;

  const when =
    today.entry_source === 'day_one_seed'
      ? COPY.initialReportLabel
      : formatChallengeTimestamp(today.checked_in_at);

  const base = `${when} (${today.wake_points} ${COPY.wakePoints})`;
  return today.sleep_back_at ? `${base} · ${COPY.sleepBack}` : base;
}
```

---

///src/utils/scoring.ts///

```ts
export function wakePointsFromLocalTime(localTime: string): number {
  // localTime in HH:MM:SS
  const t = localTime;
  if (t < '06:31:00') return 5;
  if (t < '07:01:00') return 4;
  if (t < '07:31:00') return 3;
  if (t < '08:01:00') return 2;
  if (t < '08:31:00') return 1;
  return 0;
}

export function formatWakeFeedback(points: number): string {
  if (points === 0) return '0 pts — late';
  return `${points} pts`;
}

export function computeDailyNet(wakePoints: number, hadSleepBack: boolean): number {
  const pen = hadSleepBack ? 1 : 0;
  return wakePoints - pen;
}

export function computeCumulative(wakePointsSum: number, sleepBackCount: number): number {
  return wakePointsSum - sleepBackCount;
}
```

---

///src/components/UsernamePicker.tsx///

```tsx
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
```

---

///src/components/Stage1.tsx///

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
```

---

///src/components/Stage2.tsx///

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
        // Another device already applied it: refetch and render the persisted stage.
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
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <Scoreboard participants={participants}>
        {self && hasRecord && (
          <div style={{ marginBottom: 12 }}>
            <div>
              {COPY.youCheckedInTodayAt} {when}
            </div>
            <div>
              {COPY.wakePointsLine} {formatPoints(self.today.wake_points)}
            </div>
            <div>
              {COPY.totalScore} {formatPoints(self.cumulative_points)}
            </div>
          </div>
        )}
      </Scoreboard>

      <SharedActions history={history} serverDate={serverDate}>
        {self && hasRecord && !hasSleepBack && (
          <button onClick={openSleepModal}>{COPY.sleepBackButton}</button>
        )}
      </SharedActions>

      <Modal
        open={showSleep}
        onClose={() => setShowSleep(false)}
        label={COPY.didYouSleepBack}
        dismissible={!pending}
      >
        <h3>{title}</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowSleep(false)} disabled={pending}>
            {COPY.sleepBackNah}
          </button>
          <button
            onClick={doSleepBack}
            disabled={pending}
            style={{ background: 'crimson', color: '#fff', border: 'none', padding: '6px 12px' }}
          >
            {COPY.sleepBackYea}
          </button>
        </div>
        {pending && <p aria-live="polite">...</p>}
        {err && (
          <p style={{ color: 'crimson' }} role="alert">
            {err}
          </p>
        )}
      </Modal>
    </div>
  );
}
```

---

///src/components/Stage3.tsx///

```tsx
import { Scoreboard } from './Scoreboard';
import { SharedActions } from './SharedActions';
import type { DashboardHistoryDate, DashboardParticipant } from '../types';

/**
 * Stage 3 — shared scoreboard, rules and history after a sleep-back penalty
 * was confirmed. The personal status panel and sleep-back prompt are hidden,
 * the shared scoreboard stays.
 */
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
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <Scoreboard participants={participants} />
      <SharedActions history={history} serverDate={serverDate} />
    </div>
  );
}
```

---

///src/components/Scoreboard.tsx///

```tsx
import type { ReactNode } from 'react';
import { COPY } from '../content/copy';
import { formatRecordSummary } from '../utils/format';
import type { DashboardParticipant } from '../types';

/**
 * Shared two-person scoreboard. Visible from Stage 2 onward and in the
 * challenge-over view. Shows cumulative points plus each participant's
 * today's check-in time / reported window.
 *
 * `children` renders between the heading and the rows: Stage 2 uses it for the
 * selected participant's status lines.
 */
export function Scoreboard({
  participants,
  children,
}: {
  participants: DashboardParticipant[];
  children?: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2>{COPY.scoreboard}</h2>
      {children}
      {participants.map((p) => (
        <div key={p.participant_key} style={{ margin: '8px 0' }}>
          <div style={{ fontWeight: 600 }}>
            {`${p.display_name} ${COPY.totalPts} ${p.cumulative_points}`}
          </div>
          <div style={{ fontSize: 14, color: p.today.has_record ? undefined : '#888' }}>
            {`${COPY.today} ${formatRecordSummary(p)}`}
          </div>
        </div>
      ))}
    </section>
  );
}
```

---

///src/components/SharedActions.tsx///

```tsx
import { useState, type ReactNode } from 'react';
import { COPY } from '../content/copy';
import { HistoryModal } from './HistoryModal';
import { RulesModal } from './RulesModal';
import type { DashboardHistoryDate } from '../types';

/**
 * Rules + history access. Visible from Stage 2 onward and in the
 * challenge-over view. `children` renders first, so Stage 2 can put the
 * sleep-back prompt in front of the rules and history controls.
 */
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
      <section
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
      >
        {children}
        <button onClick={() => setShowRules(true)}>{COPY.rulesButton}</button>
        <button onClick={() => setShowHistory(true)}>{COPY.viewHistoryButton}</button>
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

///src/components/Modal.tsx///

```tsx
import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  /** When false the dialog cannot be dismissed while a request is pending. */
  dismissible?: boolean;
  children: ReactNode;
};

/**
 * Accessible native <dialog> modal.
 * `showModal()` gives us the browser's focus trap, Escape handling and
 * top-layer/backdrop rendering. While a write is pending we keep the dialog
 * open and refuse to dismiss it so the user never loses the pending state.
 */
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
        // Clicks on the backdrop land on the dialog element itself.
        if (event.target === ref.current && dismissible) onClose();
      }}
      style={{
        border: 'none',
        borderRadius: 12,
        padding: 20,
        maxWidth: 480,
        maxHeight: '85vh',
        overflow: 'auto',
        fontFamily: 'system-ui',
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
```

---

///src/components/RulesModal.tsx///

```tsx
import { Modal } from './Modal';
import { COPY, RULES_BULLETS, WAKE_POINT_TABLE } from '../content/copy';
import { CHALLENGE_UTC_LABEL } from '../utils/format';

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label={COPY.rules}>
      <h3>Rules</h3>
      <ul style={{ textAlign: 'left', paddingLeft: 20, lineHeight: 1.6 }}>
        {RULES_BULLETS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <h4>Wake points</h4>
      <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 10px', borderBottom: '1px solid #ccc' }}>
              Local time ({CHALLENGE_UTC_LABEL})
            </th>
            <th style={{ padding: '4px 10px', borderBottom: '1px solid #ccc' }}>Wake points</th>
          </tr>
        </thead>
        <tbody>
          {WAKE_POINT_TABLE.map((row) => (
            <tr key={row.window}>
              <td style={{ padding: '4px 10px' }}>{row.window}</td>
              <td style={{ padding: '4px 10px', textAlign: 'center' }}>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
        The 5-point cap applies to every earlier time, including before 06:01.
      </p>
      <div style={{ textAlign: 'right', marginTop: 12 }}>
        <button onClick={onClose}>{COPY.close}</button>
      </div>
    </Modal>
  );
}
```

---

///src/components/HistoryModal.tsx///

```tsx
import { Modal } from './Modal';
import { COPY } from '../content/copy';
import { formatChallengeDate, formatChallengeTimestamp, formatPoints, isFutureDate } from '../utils/format';
import type { DashboardHistoryDate } from '../types';

/**
 * History modal: exactly the 11 challenge dates for both participants.
 * Missing past/current records show `Not checked in`; future dates show `—`.
 */
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
      <h3>{COPY.viewHistory}</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Player</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Check in</th>
            <th style={{ padding: '4px 8px' }}>Wake</th>
            <th style={{ padding: '4px 8px' }}>Sleep back</th>
            <th style={{ padding: '4px 8px' }}>Net</th>
          </tr>
        </thead>
        <tbody>
          {history.map((dateRow) => {
            const future = isFutureDate(dateRow.date, serverDate);
            return dateRow.rows.map((row, index) => (
              <tr key={`${dateRow.date}-${row.participant_key}`}>
                {index === 0 ? (
                  <td rowSpan={dateRow.rows.length} style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                    {formatChallengeDate(dateRow.date)}
                  </td>
                ) : null}
                <td style={{ padding: '4px 8px' }}>{row.display_name}</td>
                <td style={{ padding: '4px 8px' }}>
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
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  {future ? COPY.futureDash : row.record ? formatPoints(row.record.wake_points) : COPY.futureDash}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  {future
                    ? COPY.futureDash
                    : row.record
                      ? row.record.sleep_back_at
                        ? COPY.sleepBack
                        : COPY.noSleepBack
                      : COPY.futureDash}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  {future ? COPY.futureDash : row.record ? row.record.daily_net : COPY.futureDash}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', marginTop: 12 }}>
        <button onClick={onClose}>{COPY.close}</button>
      </div>
    </Modal>
  );
}
```

---

