REVOKE EXECUTE ON FUNCTION public.regenerate_demo_data() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.regenerate_demo_data() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_demo_data() TO service_role;