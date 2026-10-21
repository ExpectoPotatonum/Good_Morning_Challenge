-- Set the two participant display names.
--
-- The participant keys stay `player_1` / `player_2` (they are internal
-- identifiers used by the local-storage selection and the foreign keys in
-- daily_check_ins). Only the visible display names change.
--
-- Idempotent: re-running it is a no-op once the names match.
UPDATE public.challenge_members m
   SET display_name = v.display_name
  FROM (VALUES ('player_1', 'Jet'), ('player_2', 'Bingsu')) AS v(participant_key, display_name)
 WHERE m.participant_key = v.participant_key
   AND m.display_name IS DISTINCT FROM v.display_name;
