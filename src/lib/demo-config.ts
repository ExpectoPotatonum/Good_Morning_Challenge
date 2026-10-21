/**
 * Demo-mode configuration.
 *
 * Demo mode replaces the three database RPCs with an in-memory fake so the
 * whole check-in -> Stage 2 -> Stage 3 flow can be exercised without writing to
 * Supabase. It only ever activates in a local dev build (`import.meta.env.DEV`)
 * and the fake never calls the network.
 *
 * Enable with `?demo=1` on the dev URL (sticky for the tab, `?demo=0` clears
 * it), or with `VITE_DEMO_MODE=1` in `.env.local`.
 */

const DEMO_KEY = 'wmc_demo_mode';

/** Simulated "today" — the day after the seeded 21 October rows. */
const DEFAULT_DATE = '2026-10-22';
/** Simulated check-in time, 3 wake points. */
const DEFAULT_TIME = '07:15';

function readFlag(): boolean | null {
  try {
    const flag = new URLSearchParams(window.location.search).get('demo');
    if (flag === '1') return true;
    if (flag === '0') return false;
  } catch {
    /* not a browser */
  }
  return null;
}

function resolveDemoMode(): boolean {
  if (!import.meta.env.DEV) return false;

  const flag = readFlag();
  try {
    if (flag === true) {
      sessionStorage.setItem(DEMO_KEY, '1');
      return true;
    }
    if (flag === false) {
      sessionStorage.removeItem(DEMO_KEY);
      return false;
    }
    if (sessionStorage.getItem(DEMO_KEY) === '1') return true;
  } catch {
    /* storage disabled */
  }

  return import.meta.env.VITE_DEMO_MODE === '1';
}

export const DEMO_MODE = resolveDemoMode();

export const DEMO_DATE = (() => {
  const raw = import.meta.env.VITE_DEMO_DATE as string | undefined;
  const value = raw?.trim();
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : DEFAULT_DATE;
})();

export const DEMO_TIME = (() => {
  const raw = import.meta.env.VITE_DEMO_TIME as string | undefined;
  const value = raw?.trim();
  return value && /^\d{2}:\d{2}$/.test(value) ? value : DEFAULT_TIME;
})();
