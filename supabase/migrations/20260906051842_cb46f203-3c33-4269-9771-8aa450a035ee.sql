REVOKE ALL ON FUNCTION public.match_volunteers(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.skills_for_category(text) FROM PUBLIC, anon;
ALTER FUNCTION public.skills_for_category(text) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.match_volunteers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.skills_for_category(text) TO authenticated;