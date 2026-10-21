-- Grants
--
-- Minimal data-access boundary for the browser: the three intended RPCs only.
-- This is not identity-based security - the participant key is a public
-- selector and anyone with the URL can act as either participant.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_dashboard(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_today(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_sleep_back_today(text) TO anon, authenticated;

-- private helpers are not granted to anon
REVOKE EXECUTE ON FUNCTION private.private_check_in_at(text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.private_mark_sleep_back_at(text, timestamptz) FROM PUBLIC, anon, authenticated;
