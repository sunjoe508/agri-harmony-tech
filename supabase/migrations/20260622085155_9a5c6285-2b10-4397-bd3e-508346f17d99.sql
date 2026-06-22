
CREATE OR REPLACE FUNCTION public.regenerate_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  demos jsonb := '[
    {"id":"d1000000-0000-0000-0000-000000000001","email":"wanjiru@demo.farm","name":"Mary Wanjiru","county":"Nakuru","farm":"Wanjiru Greens","loc":"Naivasha"},
    {"id":"d1000000-0000-0000-0000-000000000002","email":"otieno@demo.farm","name":"James Otieno","county":"Kisumu","farm":"Lakeside Farm","loc":"Ahero"},
    {"id":"d1000000-0000-0000-0000-000000000003","email":"kamau@demo.farm","name":"Peter Kamau","county":"Kiambu","farm":"Highland Coffee","loc":"Limuru"}
  ]'::jsonb;
  d jsonb;
  uid uuid;
  pass text := 'Demo!2026';
  s_soil uuid; s_temp uuid; s_hum uuid; s_ph uuid;
  i int;
  ids uuid[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT array_agg((x->>'id')::uuid) INTO ids FROM jsonb_array_elements(demos) x;

  -- wipe owned data for demo users
  DELETE FROM public.sensor_readings WHERE user_id = ANY(ids);
  DELETE FROM public.irrigation_cycles WHERE user_id = ANY(ids);
  DELETE FROM public.sensors WHERE user_id = ANY(ids);
  DELETE FROM public.farm_records WHERE user_id = ANY(ids);
  DELETE FROM public.financial_transactions WHERE user_id = ANY(ids);
  DELETE FROM public.support_tickets WHERE user_id = ANY(ids);

  FOR d IN SELECT * FROM jsonb_array_elements(demos) LOOP
    uid := (d->>'id')::uuid;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = uid) THEN
      INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
      VALUES ('00000000-0000-0000-0000-000000000000', uid,'authenticated','authenticated', d->>'email', crypt(pass, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', d->>'name'),
        now(), now(), '', '', '', '');
      INSERT INTO auth.identities (id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
      VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', d->>'email','email_verified',true), 'email', uid::text, now(), now(), now());
    END IF;

    INSERT INTO public.profiles (id,email,full_name,farm_name,farm_location,county,farm_size_acres)
    VALUES (uid, d->>'email', d->>'name', d->>'farm', d->>'loc', d->>'county', (random()*15+2)::numeric(6,2))
    ON CONFLICT (id) DO UPDATE SET farm_name=EXCLUDED.farm_name, county=EXCLUDED.county, farm_location=EXCLUDED.farm_location;

    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'farmer') ON CONFLICT DO NOTHING;

    INSERT INTO public.sensors (user_id,name,type,location,unit,min_threshold,max_threshold,last_reading,last_reading_at)
    VALUES
      (uid,'Soil Moisture A','soil_moisture','North Field','%',30,70, 35+random()*30, now() - interval '5 min'),
      (uid,'Air Temp','temperature','Greenhouse','°C',15,32, 18+random()*12, now() - interval '3 min'),
      (uid,'Humidity','humidity','Greenhouse','%',40,80, 50+random()*25, now() - interval '4 min'),
      (uid,'Soil pH','ph','South Field','pH',5.5,7.5, 5.8+random()*1.4, now() - interval '10 min');

    SELECT id INTO s_soil FROM public.sensors WHERE user_id=uid AND type='soil_moisture' LIMIT 1;
    SELECT id INTO s_temp FROM public.sensors WHERE user_id=uid AND type='temperature' LIMIT 1;
    SELECT id INTO s_hum  FROM public.sensors WHERE user_id=uid AND type='humidity' LIMIT 1;
    SELECT id INTO s_ph   FROM public.sensors WHERE user_id=uid AND type='ph' LIMIT 1;

    FOR i IN 0..23 LOOP
      INSERT INTO public.sensor_readings (sensor_id,user_id,value,recorded_at) VALUES
        (s_soil, uid, 40+random()*25,  now() - (i || ' hours')::interval),
        (s_temp, uid, 18+random()*12,  now() - (i || ' hours')::interval),
        (s_hum,  uid, 50+random()*25,  now() - (i || ' hours')::interval),
        (s_ph,   uid, 6.0+random()*1.0, now() - (i || ' hours')::interval);
    END LOOP;

    INSERT INTO public.irrigation_cycles (user_id,sensor_id,name,scheduled_at,duration_minutes,trigger_threshold,status,completed_at,notes) VALUES
      (uid, s_soil,'Morning North Field', now() - interval '1 day' + interval '6 hours', 30, 35, 'completed', now() - interval '1 day' + interval '6 hours 30 min','Auto cycle'),
      (uid, s_soil,'Evening North Field', now() + interval '6 hours', 25, 35, 'scheduled', NULL, 'Cooler hours'),
      (uid, NULL,'Manual South Field', now() - interval '2 hours', 15, NULL, 'completed', now() - interval '1 hour 45 min','Manual override'),
      (uid, s_soil,'Tomorrow Cycle', now() + interval '1 day', 40, 32, 'scheduled', NULL, NULL);

    INSERT INTO public.farm_records (user_id,crop_name,variety,planted_at,harvested_at,area_acres,yield_kg,notes) VALUES
      (uid,'Maize','H614',  CURRENT_DATE - 120, CURRENT_DATE - 10, 3.5, 1850, 'Good rains, healthy crop'),
      (uid,'Tomatoes','Anna F1', CURRENT_DATE - 70, NULL, 0.5, NULL, 'Currently flowering'),
      (uid,'Beans','Rosecoco', CURRENT_DATE - 200, CURRENT_DATE - 90, 1.0, 420, 'Sold to local market');

    INSERT INTO public.financial_transactions (user_id,type,category,amount,description,occurred_on) VALUES
      (uid,'income','Crop Sale', 45000, 'Maize harvest sale', CURRENT_DATE - 8),
      (uid,'income','Crop Sale', 18500, 'Beans wholesale', CURRENT_DATE - 35),
      (uid,'income','Dairy', 12000, 'Milk co-op payout', CURRENT_DATE - 14),
      (uid,'expense','Seeds', 4200, 'Hybrid maize seeds', CURRENT_DATE - 130),
      (uid,'expense','Fertilizer', 8800, 'DAP + CAN top-dressing', CURRENT_DATE - 110),
      (uid,'expense','Labor', 6500, 'Harvest crew wages', CURRENT_DATE - 12),
      (uid,'expense','Irrigation', 3200, 'Drip line repairs', CURRENT_DATE - 22),
      (uid,'expense','Transport', 1800, 'Market delivery', CURRENT_DATE - 9);

    INSERT INTO public.support_tickets (user_id,subject,message,status,priority) VALUES
      (uid,'Sensor offline','Soil moisture sensor in North Field stopped reporting overnight.','open','high'),
      (uid,'Question about pricing','Can I upgrade to the pro plan mid-month?','in_progress','normal'),
      (uid,'Resolved: app crash','App crashed on weather page, but works after update.','resolved','low');
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'users', ids);
END $fn$;

REVOKE ALL ON FUNCTION public.regenerate_demo_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_demo_data() TO authenticated;
