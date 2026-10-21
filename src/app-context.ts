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
