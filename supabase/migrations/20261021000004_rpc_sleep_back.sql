-- mark_sleep_back_today + private deterministic helper
--
-- The private helper takes the timestamp as an argument so database
-- integration tests can pin "now" instead of depending on the real clock.
-- It is never exposed through the Data API.
CREATE OR REPLACE FUNCTION private.private_mark_sleep_back_at(p_participant_key TEXT, p_now TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_challenge_id UUID;
  v_tz TEXT;
  v_ch_date DATE;
  v_sb TIMESTAMPTZ;
BEGIN
  SELECT cm.challenge_id
    INTO v_challenge_id
  FROM public.challenge_members cm
  WHERE cm.participant_key = p_participant_key;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'UNKNOWN_PARTICIPANT');
  END IF;

  SELECT c.timezone
    INTO v_tz
  FROM public.challenges c
  WHERE c.id = v_challenge_id;

  v_ch_date := (p_now AT TIME ZONE v_tz)::date;

  -- Find today's row by (participant_key, challenge_date).
  -- checked_in_at may be NULL (21 October seed row) and must still match.
  SELECT sleep_back_at
    INTO v_sb
  FROM public.daily_check_ins d
  WHERE d.challenge_id = v_challenge_id
    AND d.participant_key = p_participant_key
    AND d.challenge_date = v_ch_date;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'NO_CHECK_IN_TODAY', 'challenge_date', v_ch_date);
  END IF;

  IF v_sb IS NOT NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'SLEEP_BACK_ALREADY_MARKED', 'sleep_back_at', v_sb);
  END IF;

  -- Atomic: only the first request can set sleep_back_at.
  UPDATE public.daily_check_ins
  SET sleep_back_at = p_now
  WHERE challenge_id = v_challenge_id
    AND participant_key = p_participant_key
    AND challenge_date = v_ch_date
    AND sleep_back_at IS NULL;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'code', 'OK',
    'sleep_back_at', p_now,
    'challenge_date', v_ch_date
  );
END;
$$;

CREATE OR REPLACE FUNCTION mark_sleep_back_today(p_participant_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  RETURN private.private_mark_sleep_back_at(p_participant_key, v_now);
END;
$$;
