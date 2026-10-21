-- Configure participants and seed
INSERT INTO challenges (id, name, starts_on, ends_on, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'Wake-Up Challenge', DATE '2026-10-21', DATE '2026-10-31', 'Asia/Kuala_Lumpur')
ON CONFLICT DO NOTHING;

INSERT INTO challenge_members (participant_key, challenge_id, display_name, sort_order)
VALUES
  ('player_1', '00000000-0000-0000-0000-000000000001', 'Player 1', 1),
  ('player_2', '00000000-0000-0000-0000-000000000001', 'Player 2', 2)
ON CONFLICT (participant_key) DO NOTHING;

-- Seed initial report rows for 21 Oct 2026 (idempotent)
INSERT INTO daily_check_ins (id, challenge_id, participant_key, challenge_date, entry_source, checked_in_at, reported_wake_window, wake_points, sleep_back_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'player_1', DATE '2026-10-21', 'day_one_seed', NULL, '08:01–08:30', 1, NULL),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'player_2', DATE '2026-10-21', 'day_one_seed', NULL, '08:01–08:30', 1, NULL)
ON CONFLICT (challenge_id, participant_key, challenge_date) DO NOTHING;
