-- Grants
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_dashboard(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_today(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_sleep_back_today(text) TO anon, authenticated;

-- private functions not granted to anon
REVOKE EXECUTE ON FUNCTION private.private_check_in_at(text, timestamptz) FROM PUBLIC, anon, authenticated;
