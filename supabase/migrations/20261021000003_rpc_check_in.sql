-- check_in_today and private helper
CREATE OR REPLACE FUNCTION private.private_check_in_at(p_participant_key TEXT, p_now TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_challenge_id UUID;
  v_tz TEXT;
  v_starts_on DATE;
  v_ends_on DATE;
  v_ch_date DATE;
  v_local TIME;
  v_pts SMALLINT;
  v_id UUID;
BEGIN
  -- lookup participant
  SELECT cm.challenge_id
    INTO v_challenge_id
  FROM public.challenge_members cm
  WHERE cm.participant_key = p_participant_key;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'UNKNOWN_PARTICIPANT');
  END IF;

  SELECT c.timezone, c.starts_on, c.ends_on
    INTO v_tz, v_starts_on, v_ends_on
  FROM public.challenges c
  WHERE c.id = v_challenge_id;

  v_ch_date := (p_now AT TIME ZONE v_tz)::date;
  v_local := (p_now AT TIME ZONE v_tz)::time;

  -- check window
  IF v_ch_date < v_starts_on OR v_ch_date > v_ends_on THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CHALLENGE_NOT_ACTIVE', 'challenge_date', v_ch_date);
  END IF;

  -- compute points
  IF v_local < '06:31:00'::time THEN
    v_pts := 5;
  ELSIF v_local < '07:01:00'::time THEN
    v_pts := 4;
  ELSIF v_local < '07:31:00'::time THEN
    v_pts := 3;
  ELSIF v_local < '08:01:00'::time THEN
    v_pts := 2;
  ELSIF v_local < '08:31:00'::time THEN
    v_pts := 1;
  ELSE
    v_pts := 0;
  END IF;

  -- insert
  INSERT INTO public.daily_check_ins (challenge_id, participant_key, challenge_date, entry_source, checked_in_at, reported_wake_window, wake_points, sleep_back_at)
  VALUES (v_challenge_id, p_participant_key, v_ch_date, 'live', p_now, NULL, v_pts, NULL)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'code', 'OK',
    'id', v_id,
    'challenge_date', v_ch_date,
    'checked_in_at', p_now,
    'wake_points', v_pts,
    'daily_net', v_pts
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'ALREADY_CHECKED_IN');
  WHEN check_violation OR foreign_key_violation THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'DATABASE_ERROR');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'DATABASE_ERROR');
END;
$$;

CREATE OR REPLACE FUNCTION check_in_today(p_participant_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  res JSONB;
BEGIN
  res := private.private_check_in_at(p_participant_key, v_now);
  RETURN res;
END;
$$;
