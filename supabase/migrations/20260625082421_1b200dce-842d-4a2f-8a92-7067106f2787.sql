
-- 1) Avatars bucket: restrict SELECT to folder owner
DROP POLICY IF EXISTS "Avatar files readable by authenticated" ON storage.objects;
CREATE POLICY "Users read own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2) admin_roles: explicit admin-only write policies
CREATE POLICY "Admins insert admin roles"
ON public.admin_roles FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update admin roles"
ON public.admin_roles FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete admin roles"
ON public.admin_roles FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- 3) Realtime messages: restrict broadcast/presence subscriptions to user-scoped topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users receive own realtime topics" ON realtime.messages;
CREATE POLICY "Users receive own realtime topics"
ON realtime.messages FOR SELECT TO authenticated
USING (realtime.topic() = 'user:' || (auth.uid())::text);

DROP POLICY IF EXISTS "Users publish own realtime topics" ON realtime.messages;
CREATE POLICY "Users publish own realtime topics"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (realtime.topic() = 'user:' || (auth.uid())::text);

-- 4) SECURITY DEFINER function executability
-- Trigger-only functions: no direct callers needed
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Role-check helpers: must remain callable by authenticated (used in RLS),
-- but should not be reachable by anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_admin_role(uuid, public.admin_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(uuid, public.admin_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Admin-only RPC: gated by internal is_admin() check, keep authenticated EXECUTE
REVOKE ALL ON FUNCTION public.regenerate_demo_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.regenerate_demo_data() TO authenticated;
