ALTER TABLE public.volunteer_status ADD COLUMN IF NOT EXISTS location geography(Point,4326);
CREATE INDEX IF NOT EXISTS volunteer_status_location_idx ON public.volunteer_status USING GIST (location);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS response text NOT NULL DEFAULT 'pending';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS distance_m double precision;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_response_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_response_check CHECK (response IN ('pending','accepted','declined'));

CREATE OR REPLACE FUNCTION public.skills_for_category(_category text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _category
    WHEN 'Road Accident' THEN ARRAY['First Aid','CPR','Driving']
    WHEN 'Medical Emergency' THEN ARRAY['First Aid','CPR','Medical Professional']
    WHEN 'Fire' THEN ARRAY['Firefighting','First Aid']
    WHEN 'Flood' THEN ARRAY['Search & Rescue','Swimming']
    WHEN 'Building Collapse' THEN ARRAY['Search & Rescue','First Aid']
    WHEN 'Missing Person' THEN ARRAY['Search & Rescue']
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.match_volunteers(_incident_id uuid)
RETURNS TABLE (user_id uuid, name text, distance_m double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inc public.incidents%ROWTYPE;
  wanted text[];
BEGIN
  SELECT * INTO inc FROM public.incidents WHERE id = _incident_id;
  IF inc.id IS NULL OR inc.location IS NULL THEN
    RETURN;
  END IF;
  wanted := public.skills_for_category(inc.category);

  RETURN QUERY
  WITH nearby AS (
    SELECT v.user_id AS uid,
           u.name AS uname,
           ST_Distance(v.location, inc.location) AS dist
    FROM public.volunteer_status v
    JOIN public.users u ON u.id = v.user_id
    WHERE v.is_volunteer
      AND v.availability = 'available'
      AND v.location IS NOT NULL
      AND v.user_id <> inc.reporter_id
      AND ST_DWithin(v.location, inc.location, 2000)
      AND EXISTS (
        SELECT 1 FROM public.user_skills s
        WHERE s.user_id = v.user_id
          AND (wanted IS NULL OR s.skill_name = ANY (wanted))
      )
    ORDER BY dist
    LIMIT 5
  ), ins AS (
    INSERT INTO public.notifications (user_id, incident_id, type, distance_m)
    SELECT uid, _incident_id, 'volunteer_request', dist FROM nearby
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT uid, uname, dist FROM nearby ORDER BY dist;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_volunteers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.skills_for_category(text) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;