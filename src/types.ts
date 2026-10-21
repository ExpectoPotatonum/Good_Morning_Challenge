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
