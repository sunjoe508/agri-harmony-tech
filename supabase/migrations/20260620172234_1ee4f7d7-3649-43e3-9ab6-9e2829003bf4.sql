
-- Seed admin user
DO $$
DECLARE
  admin_uid uuid := 'a0000000-0000-0000-0000-000000000001';
  admin_email text := 'admin@agrismart.app';
  admin_pass text := 'AgriAdmin!2026';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_uid) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated',
      admin_email, crypt(admin_pass, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','System Admin'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_uid,
      jsonb_build_object('sub', admin_uid::text, 'email', admin_email, 'email_verified', true),
      'email', admin_uid::text, now(), now(), now());
  END IF;

  INSERT INTO public.admin_roles (user_id, role) VALUES (admin_uid, 'super_admin')
    ON CONFLICT DO NOTHING;
END $$;
