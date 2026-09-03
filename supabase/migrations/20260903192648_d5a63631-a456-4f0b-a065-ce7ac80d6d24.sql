CREATE EXTENSION IF NOT EXISTS postgis;

-- USERS
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age int,
  email text,
  phone text,
  platform_user_id text UNIQUE NOT NULL,
  identity_verified boolean NOT NULL DEFAULT false,
  phone_verified boolean NOT NULL DEFAULT false,
  profession text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Public profile projection (only non-sensitive columns)
CREATE VIEW public.public_profiles AS
  SELECT id, name, platform_user_id, profession, identity_verified, phone_verified
  FROM public.users;
GRANT SELECT ON public.public_profiles TO authenticated;

-- USER SKILLS
CREATE TABLE public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  status text NOT NULL DEFAULT 'self_declared' CHECK (status IN ('self_declared','certified')),
  proof_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_skills_user_id_idx ON public.user_skills(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_skills TO authenticated;
GRANT ALL ON public.user_skills TO service_role;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_select_all_authenticated" ON public.user_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills_insert_own" ON public.user_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skills_update_own" ON public.user_skills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skills_delete_own" ON public.user_skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- VOLUNTEER STATUS
CREATE TABLE public.volunteer_status (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  is_volunteer boolean NOT NULL DEFAULT false,
  availability text NOT NULL DEFAULT 'unavailable' CHECK (availability IN ('available','unavailable')),
  last_updated timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_status TO authenticated;
GRANT ALL ON public.volunteer_status TO service_role;
ALTER TABLE public.volunteer_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "volunteer_select_all_authenticated" ON public.volunteer_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "volunteer_insert_own" ON public.volunteer_status FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "volunteer_update_own" ON public.volunteer_status FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- INCIDENTS
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text,
  location geography(Point,4326),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX incidents_location_idx ON public.incidents USING GIST (location);
CREATE INDEX incidents_status_idx ON public.incidents(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents_select_authenticated" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "incidents_insert_own" ON public.incidents FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "incidents_update_reporter" ON public.incidents FOR UPDATE TO authenticated USING (auth.uid() = reporter_id) WITH CHECK (auth.uid() = reporter_id);

-- INCIDENT PARTICIPANTS
CREATE TABLE public.incident_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('reporter','volunteer','hospital','admin')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_id, user_id, role)
);
CREATE INDEX incident_participants_incident_idx ON public.incident_participants(incident_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incident_participants TO authenticated;
GRANT ALL ON public.incident_participants TO service_role;
ALTER TABLE public.incident_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_incident_participant(_incident_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.incident_participants
    WHERE incident_id = _incident_id AND user_id = _user_id
  );
$$;

CREATE POLICY "participants_select_own_incidents" ON public.incident_participants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_incident_participant(incident_id, auth.uid()));
CREATE POLICY "participants_join_self" ON public.incident_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "participants_leave_self" ON public.incident_participants FOR DELETE TO authenticated USING (user_id = auth.uid());

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_incident_idx ON public.messages(incident_id, sent_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_participants" ON public.messages FOR SELECT TO authenticated
  USING (public.is_incident_participant(incident_id, auth.uid()));
CREATE POLICY "messages_insert_participants" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_incident_participant(incident_id, auth.uid()));

-- HOSPITALS
CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location geography(Point,4326),
  is_connected boolean NOT NULL DEFAULT true,
  contact_info text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hospitals_location_idx ON public.hospitals USING GIST (location);
GRANT SELECT ON public.hospitals TO authenticated;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hospitals_select_authenticated" ON public.hospitals FOR SELECT TO authenticated USING (true);

-- HOSPITAL ACKNOWLEDGEMENTS
CREATE TABLE public.hospital_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_id, hospital_id)
);
GRANT SELECT ON public.hospital_acknowledgements TO authenticated;
GRANT ALL ON public.hospital_acknowledgements TO service_role;
ALTER TABLE public.hospital_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acks_select_authenticated" ON public.hospital_acknowledgements FOR SELECT TO authenticated USING (true);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES public.incidents(id) ON DELETE CASCADE,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);