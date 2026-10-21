-- RPCs for Wake-Up Challenge (no RLS)
CREATE OR REPLACE FUNCTION get_dashboard(p_participant_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_challenge_id UUID;
  v_challenge_name TEXT;
  v_starts_on DATE;
  v_ends_on DATE;
  v_tz TEXT;
  v_now TIMESTAMPTZ;
  v_challenge_date DATE;
  v_status TEXT;
  v_selected_key TEXT;
  v_selected_name TEXT;
  v_participants JSONB;
  v_history JSONB;
BEGIN
  -- validate participant
  SELECT cm.participant_key, cm.display_name, cm.challenge_id
    INTO v_selected_key, v_selected_name, v_challenge_id
  FROM public.challenge_members cm
  WHERE cm.participant_key = p_participant_key;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'UNKNOWN_PARTICIPANT');
  END IF;

  -- get challenge
  SELECT c.name, c.starts_on, c.ends_on, c.timezone
    INTO v_challenge_name, v_starts_on, v_ends_on, v_tz
  FROM public.challenges c
  WHERE c.id = v_challenge_id;

  v_now := clock_timestamp();
  -- compute challenge date in canonical tz
  v_challenge_date := (v_now AT TIME ZONE v_tz)::date;

  -- status
  IF v_challenge_date < v_starts_on THEN
    v_status := 'before';
  ELSIF v_challenge_date > v_ends_on THEN
    v_status := 'over';
  ELSE
    v_status := 'active';
  END IF;

  -- build participants
  WITH members AS (
    SELECT cm.participant_key, cm.display_name, cm.sort_order
    FROM public.challenge_members cm
    WHERE cm.challenge_id = v_challenge_id
    ORDER BY cm.sort_order
  ),
  today_rows AS (
    SELECT d.participant_key,
           d.entry_source,
           d.checked_in_at,
           d.reported_wake_window,
           d.wake_points,
           d.sleep_back_at,
           (d.wake_points - CASE WHEN d.sleep_back_at IS NOT NULL THEN 1 ELSE 0 END) AS daily_net
    FROM public.daily_check_ins d
    WHERE d.challenge_id = v_challenge_id AND d.challenge_date = v_challenge_date
  ),
  cum AS (
    SELECT d.participant_key,
           COALESCE(SUM(d.wake_points), 0) - COALESCE(SUM(CASE WHEN d.sleep_back_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS cumulative
    FROM public.daily_check_ins d
    WHERE d.challenge_id = v_challenge_id
    GROUP BY d.participant_key
  )
  SELECT jsonb_agg(
           jsonb_build_object(
             'participant_key', m.participant_key,
             'display_name', m.display_name,
             'today', COALESCE(
               jsonb_build_object(
                 'has_record', TRUE,
                 'entry_source', t.entry_source,
                 'checked_in_at', t.checked_in_at,
                 'reported_wake_window', t.reported_wake_window,
                 'wake_points', t.wake_points,
                 'sleep_back_at', t.sleep_back_at,
                 'daily_net', t.daily_net
               ),
               jsonb_build_object('has_record', FALSE)
             ),
             'cumulative_points', COALESCE(c.cumulative, 0)
           )
           ORDER BY m.sort_order
         )
  INTO v_participants
  FROM members m
  LEFT JOIN today_rows t ON t.participant_key = m.participant_key
  LEFT JOIN cum c ON c.participant_key = m.participant_key;

  -- build history (all 11 dates from starts_on to ends_on)
  WITH dates AS (
    SELECT generate_series(v_starts_on, v_ends_on, '1 day'::interval)::date AS d
    ORDER BY d
  ),
  all_pairs AS (
    SELECT m.participant_key, m.display_name, m.sort_order, dt.d AS challenge_date
    FROM public.challenge_members m
    CROSS JOIN dates dt
    WHERE m.challenge_id = v_challenge_id
  ),
  recs AS (
    SELECT d.participant_key, d.challenge_date, d.entry_source, d.checked_in_at, d.reported_wake_window, d.wake_points, d.sleep_back_at
    FROM public.daily_check_ins d
    WHERE d.challenge_id = v_challenge_id
  )
  SELECT jsonb_agg(
           jsonb_build_object(
             'date', ap.challenge_date,
             'rows', (
               SELECT jsonb_agg(
                        jsonb_build_object(
                          'participant_key', ap2.participant_key,
                          'display_name', ap2.display_name,
                          'record', COALESCE(
                            jsonb_build_object(
                              'entry_source', r.entry_source,
                              'checked_in_at', r.checked_in_at,
                              'reported_wake_window', r.reported_wake_window,
                              'wake_points', r.wake_points,
                              'sleep_back_at', r.sleep_back_at,
                              'daily_net', (r.wake_points - CASE WHEN r.sleep_back_at IS NOT NULL THEN 1 ELSE 0 END)
                            ),
                            NULL
                          )
                        )
                        ORDER BY ap2.sort_order
                      )
               FROM all_pairs ap2
               LEFT JOIN recs r ON r.participant_key = ap2.participant_key AND r.challenge_date = ap.challenge_date
               WHERE ap2.challenge_date = ap.challenge_date
             )
           )
           ORDER BY ap.challenge_date
         )
  INTO v_history
  FROM (SELECT DISTINCT d, 1 AS dummy FROM dates) ds
  LEFT JOIN all_pairs ap ON ap.challenge_date = ds.d
  GROUP BY ap.challenge_date;

  RETURN jsonb_build_object(
    'server_now', v_now,
    'server_challenge_date', v_challenge_date,
    'challenge', jsonb_build_object(
      'id', v_challenge_id,
      'name', v_challenge_name,
      'starts_on', v_starts_on,
      'ends_on', v_ends_on,
      'timezone', v_tz,
      'status', v_status
    ),
    'selected', jsonb_build_object(
      'participant_key', v_selected_key,
      'display_name', v_selected_name
    ),
    'participants', v_participants,
    'history', COALESCE(v_history, '[]'::jsonb)
  );
END;
$$;
