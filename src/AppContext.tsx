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
