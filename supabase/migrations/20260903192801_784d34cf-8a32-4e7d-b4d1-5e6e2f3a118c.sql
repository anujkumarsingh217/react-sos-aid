DROP VIEW IF EXISTS public.public_profiles;

CREATE TABLE public.user_contacts (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  age int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_contacts TO authenticated;
GRANT ALL ON public.user_contacts TO service_role;
ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select_own" ON public.user_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert_own" ON public.user_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update_own" ON public.user_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_delete_own" ON public.user_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.user_contacts (user_id, email, phone, age)
  SELECT id, email, phone, age FROM public.users;

ALTER TABLE public.users DROP COLUMN email, DROP COLUMN phone, DROP COLUMN age;

CREATE POLICY "users_select_public_profile" ON public.users FOR SELECT TO authenticated USING (true);

REVOKE ALL ON FUNCTION public.is_incident_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_incident_participant(uuid, uuid) TO authenticated, service_role;