import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../src/App';
import { AppProvider } from '../src/AppContext';
import { COPY } from '../src/content/copy';

/**
 * Live end-to-end check against the real Supabase project.
 *
 * Read-only: it only calls get_dashboard() and renders the result, it never
 * checks in and never applies a penalty. Skipped when no project is
 * configured.
 */

const hasProject = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const suite = hasProject ? describe : describe.skip;

suite('live database', () => {
  beforeEach(() => {
    localStorage.setItem('wmc_participant_key', 'player_1');
  });

  it('renders the real dashboard for player 1', async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );

    // Player 1 is checked in for today (21 October seed row), so the app is
    // in Stage 2: shared scoreboard + personal status.
    await waitFor(() => expect(screen.getByText(COPY.scoreboard)).toBeTruthy(), { timeout: 15000 });

    expect(screen.getByText('Player 1')).toBeTruthy();
    expect(screen.getByText('Player 2')).toBeTruthy();
    expect(screen.getByText(COPY.didYouSleepBack)).toBeTruthy();
    expect(screen.getAllByText(/08:01–08:30 — initial report/).length).toBeGreaterThan(0);
  });

  it('shows one history entry per challenge date', async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );

    await waitFor(() => expect(screen.getByText(COPY.scoreboard)).toBeTruthy(), { timeout: 15000 });
    await userEvent.click(screen.getByRole('button', { name: COPY.viewHistory }));

    // 21 - 31 October 2026 inclusive.
    expect(screen.getAllByText('21 Oct 2026').length).toBeGreaterThan(0);
    expect(screen.getAllByText('31 Oct 2026').length).toBeGreaterThan(0);
    const rows = screen.getAllByRole('row');
    // 1 header + 11 dates x 2 participants
    expect(rows.length).toBe(23);
  });
});
