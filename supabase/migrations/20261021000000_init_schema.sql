-- Wake-Up Challenge schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Wake-Up Challenge',
  starts_on DATE NOT NULL DEFAULT DATE '2026-10-21',
  ends_on DATE NOT NULL DEFAULT DATE '2026-10-31',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_members (
  participant_key TEXT PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE RESTRICT,
  participant_key TEXT NOT NULL REFERENCES challenge_members(participant_key) ON DELETE RESTRICT,
  challenge_date DATE NOT NULL,
  entry_source TEXT NOT NULL CHECK (entry_source IN ('live','day_one_seed')),
  checked_in_at TIMESTAMPTZ,
  reported_wake_window TEXT,
  wake_points SMALLINT NOT NULL CHECK (wake_points BETWEEN 0 AND 5),
  sleep_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_check_ins_unique UNIQUE (challenge_id, participant_key, challenge_date),
  CONSTRAINT daily_check_ins_live_check CHECK (
    (entry_source = 'live' AND checked_in_at IS NOT NULL AND reported_wake_window IS NULL) OR
    (entry_source <> 'live')
  ),
  CONSTRAINT daily_check_ins_seed_check CHECK (
    (entry_source = 'day_one_seed' AND challenge_date = DATE '2026-10-21' AND checked_in_at IS NULL AND reported_wake_window = '08:01–08:30' AND wake_points = 1) OR
    (entry_source <> 'day_one_seed')
  )
);

CREATE INDEX IF NOT EXISTS idx_daily_check_ins_challenge_date ON daily_check_ins(challenge_id, challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_participant ON daily_check_ins(participant_key, challenge_date);
