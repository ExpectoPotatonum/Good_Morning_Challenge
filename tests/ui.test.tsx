import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const rpc = vi.fn();

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

import App from '../src/App';
import { AppProvider } from '../src/AppContext';
import { COPY } from '../src/content/copy';

const PARTICIPANTS = [
  {
    participant_key: 'player_1',
    display_name: 'Player 1',
    today: { has_record: false },
    cumulative_points: 0,
  },
  {
    participant_key: 'player_2',
    display_name: 'Player 2',
    today: { has_record: false },
    cumulative_points: 0,
  },
];

const dashboardWith = (overrides: Record<string, unknown> = {}) => ({
  server_now: '2026-10-21T00:00:00Z',
  server_challenge_date: '2026-10-21',
  challenge: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Wake-Up Challenge',
    starts_on: '2026-10-21',
    ends_on: '2026-10-31',
    timezone: 'Asia/Kuala_Lumpur',
    status: 'active',
  },
  selected: { participant_key: 'player_1', display_name: 'Player 1' },
  participants: PARTICIPANTS,
  history: Array.from({ length: 11 }, (_, i) => ({
    date: `2026-10-${String(21 + i).padStart(2, '0')}`,
    rows: PARTICIPANTS.map((p) => ({ ...p, record: null })),
  })),
  ...overrides,
});

const renderApp = () =>
  render(
    <AppProvider>
      <App />
    </AppProvider>,
  );

beforeEach(() => {
  rpc.mockReset();
  localStorage.setItem('wmc_participant_key', 'player_1');
});

describe('username picker', () => {
  it('offers both participants and stores the selection', async () => {
    localStorage.removeItem('wmc_participant_key');
    rpc.mockResolvedValue({ data: dashboardWith(), error: null });
    renderApp();

    expect(screen.getByText('Player 1')).toBeTruthy();
    expect(screen.getByText('Player 2')).toBeTruthy();

    await userEvent.click(screen.getByText('Player 1'));
    expect(localStorage.getItem('wmc_participant_key')).toBe('player_1');
  });
});

describe('stage 1', () => {
  it('shows only the check-in experience before today’s check-in', async () => {
    rpc.mockResolvedValue({ data: dashboardWith(), error: null });
    renderApp();

    await waitFor(() => expect(screen.getByText(COPY.stage1Helper)).toBeTruthy());
    expect(screen.queryByText(COPY.scoreboard)).toBeNull();
    expect(screen.queryByText(COPY.rules)).toBeNull();
    expect(screen.queryByText(COPY.viewHistory)).toBeNull();
    expect(screen.getByText(COPY.notHavingGoodMorning)).toBeTruthy();
  });

  it('calls check_in_today from the main button', async () => {
    rpc.mockResolvedValue({ data: dashboardWith(), error: null });
    renderApp();
    await waitFor(() => expect(screen.getByText(COPY.stage1Helper)).toBeTruthy());

    rpc.mockResolvedValueOnce({ data: { ok: true, code: 'OK', wake_points: 4 }, error: null });
    await userEvent.click(
      screen.getByRole('button', {
        name: /^(早安图 )?(GOOD MOANING|GOOD MEOWING|GOOD MORNING|good morning|早上好.*)$/,
      }),
    );

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith('check_in_today', { p_participant_key: 'player_1' }),
    );
  });

  it('calls the same check-in action from the yay button in the modal', async () => {
    rpc.mockResolvedValue({ data: dashboardWith(), error: null });
    renderApp();
    await waitFor(() => expect(screen.getByText(COPY.stage1Helper)).toBeTruthy());

    await userEvent.click(screen.getByText(COPY.notHavingGoodMorning));
    expect(screen.getByText(COPY.meowBlessing)).toBeTruthy();

    rpc.mockResolvedValueOnce({ data: { ok: true, code: 'OK', wake_points: 4 }, error: null });
    await userEvent.click(screen.getByText(COPY.yay));

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith('check_in_today', { p_participant_key: 'player_1' }),
    );
  });

  it('keeps the modal open and shows the error when the check-in fails', async () => {
    rpc.mockResolvedValue({ data: dashboardWith(), error: null });
    renderApp();
    await waitFor(() => expect(screen.getByText(COPY.stage1Helper)).toBeTruthy());

    await userEvent.click(screen.getByText(COPY.notHavingGoodMorning));
    rpc.mockResolvedValueOnce({ data: { ok: false, code: 'DATABASE_ERROR' }, error: null });
    await userEvent.click(screen.getByText(COPY.yay));

    await waitFor(() => expect(screen.getByText('DATABASE_ERROR')).toBeTruthy());
    expect(screen.getByText(COPY.meowBlessing)).toBeTruthy();
  });
});

describe('stage 2', () => {
  const dashboard = dashboardWith({
    participants: [
      {
        participant_key: 'player_1',
        display_name: 'Player 1',
        today: {
          has_record: true,
          entry_source: 'day_one_seed',
          checked_in_at: null,
          reported_wake_window: '08:01–08:30',
          wake_points: 1,
          sleep_back_at: null,
          daily_net: 1,
        },
        cumulative_points: 1,
      },
      {
        participant_key: 'player_2',
        display_name: 'Player 2',
        today: { has_record: false },
        cumulative_points: 0,
      },
    ],
  });

  it('shows the shared scoreboard, rules/history access and the personal status', async () => {
    rpc.mockResolvedValue({ data: dashboard, error: null });
    renderApp();

    await waitFor(() => expect(screen.getByText(COPY.scoreboard)).toBeTruthy());
    expect(screen.getByText(COPY.rules)).toBeTruthy();
    expect(screen.getByRole('button', { name: COPY.viewHistory })).toBeTruthy();
    expect(screen.getByText(COPY.didYouSleepBack)).toBeTruthy();
    expect(screen.getAllByText(/08:01–08:30 — initial report/).length).toBeGreaterThan(0);
  });

  it('opens the rules modal with the wake point table', async () => {
    rpc.mockResolvedValue({ data: dashboard, error: null });
    renderApp();
    await waitFor(() => expect(screen.getByText(COPY.rules)).toBeTruthy());

    await userEvent.click(screen.getByText(COPY.rules));
    expect(screen.getByText('06:31:00 – 07:00:59')).toBeTruthy();
    expect(screen.getByText('08:31:00 – 23:59:59')).toBeTruthy();
  });

  it('opens the history modal with all 11 dates', async () => {
    rpc.mockResolvedValue({ data: dashboard, error: null });
    renderApp();
    await waitFor(() => expect(screen.getByText(COPY.viewHistory)).toBeTruthy());

    await userEvent.click(screen.getByRole('button', { name: COPY.viewHistory }));
    expect(screen.getByText('21 Oct 2026')).toBeTruthy();
    expect(screen.getByText('31 Oct 2026')).toBeTruthy();
    expect(screen.getAllByText(COPY.notCheckedIn).length).toBeGreaterThan(0);
  });

  it('marks a sleep-back through mark_sleep_back_today', async () => {
    rpc.mockResolvedValue({ data: dashboard, error: null });
    renderApp();
    await waitFor(() => expect(screen.getByText(COPY.didYouSleepBack)).toBeTruthy());

    await userEvent.click(screen.getByText(COPY.didYouSleepBack));
    rpc.mockResolvedValueOnce({ data: { ok: true, code: 'OK' }, error: null });
    await userEvent.click(screen.getByText(COPY.sleepBackYea));

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith('mark_sleep_back_today', { p_participant_key: 'player_1' }),
    );
  });

  it('does not write when the sleep-back modal is cancelled', async () => {
    rpc.mockResolvedValue({ data: dashboard, error: null });
    renderApp();
    await waitFor(() => expect(screen.getByText(COPY.didYouSleepBack)).toBeTruthy());

    await userEvent.click(screen.getByText(COPY.didYouSleepBack));
    await userEvent.click(screen.getByText(COPY.sleepBackNah));

    expect(rpc).not.toHaveBeenCalledWith('mark_sleep_back_today', expect.anything());
  });
});

describe('stage 3', () => {
  it('hides the personal status and sleep-back prompt but keeps the scoreboard', async () => {
    const dashboard = dashboardWith({
      participants: [
        {
          participant_key: 'player_1',
          display_name: 'Player 1',
          today: {
            has_record: true,
            entry_source: 'live',
            checked_in_at: '2026-10-21T23:15:07Z',
            reported_wake_window: null,
            wake_points: 3,
            sleep_back_at: '2026-10-21T23:20:00Z',
            daily_net: 2,
          },
          cumulative_points: 3,
        },
        PARTICIPANTS[1],
      ],
    });
    rpc.mockResolvedValue({ data: dashboard, error: null });
    renderApp();

    await waitFor(() => expect(screen.getByText(COPY.scoreboard)).toBeTruthy());
    expect(screen.queryByText(COPY.didYouSleepBack)).toBeNull();
    expect(screen.getByText(COPY.rules)).toBeTruthy();
  });

  it('shows live check-in timestamps with seconds and the timezone', async () => {
    const dashboard = dashboardWith({
      participants: [
        {
          participant_key: 'player_1',
          display_name: 'Player 1',
          today: {
            has_record: true,
            entry_source: 'live',
            checked_in_at: '2026-10-21T23:15:07Z',
            reported_wake_window: null,
            wake_points: 3,
            sleep_back_at: null,
            daily_net: 3,
          },
          cumulative_points: 3,
        },
        PARTICIPANTS[1],
      ],
    });
    rpc.mockResolvedValue({ data: dashboard, error: null });
    renderApp();

    await waitFor(() => expect(screen.getByText(COPY.scoreboard)).toBeTruthy());
    expect(screen.getAllByText(/22 Oct 2026, 07:15:07 \(Asia\/Kuala_Lumpur\)/).length).toBeGreaterThan(0);
  });
});

describe('challenge over', () => {
  it('hides the check-in action and shows the final totals', async () => {
    const dashboard = dashboardWith({
      challenge: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Wake-Up Challenge',
        starts_on: '2026-10-21',
        ends_on: '2026-10-31',
        timezone: 'Asia/Kuala_Lumpur',
        status: 'over',
      },
      server_challenge_date: '2026-11-01',
    });
    rpc.mockResolvedValue({ data: dashboard, error: null });
    renderApp();

    await waitFor(() => expect(screen.getByText(COPY.challengeOver)).toBeTruthy());
    expect(screen.queryByText(COPY.stage1Helper)).toBeNull();
    expect(screen.getByText(COPY.scoreboard)).toBeTruthy();
  });
});

describe('unknown participant', () => {
  it('returns to the picker with a clear message', async () => {
    rpc.mockResolvedValue({ data: { error: 'UNKNOWN_PARTICIPANT' }, error: null });
    renderApp();

    await waitFor(() => expect(screen.getByText('Unknown participant')).toBeTruthy());
  });
});
