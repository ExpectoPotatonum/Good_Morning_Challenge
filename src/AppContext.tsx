import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { DashboardResponse } from './types';

interface AppCtx {
  participantKey: string | null;
  setParticipantKey: (k: string | null) => void;
  dashboard: DashboardResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppCtx>({} as any);

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

  const setParticipantKey = (k: string | null) => {
    try {
      if (k) localStorage.setItem(LS_KEY, k);
      else localStorage.removeItem(LS_KEY);
    } catch {}
    setParticipantKeyState(k);
  };

  const refresh = async () => {
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
    } catch (e) {
      setDashboard({ error: 'DATABASE_ERROR' } as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [participantKey]);

  return <Ctx.Provider value={{ participantKey, setParticipantKey, dashboard, loading, refresh }}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
