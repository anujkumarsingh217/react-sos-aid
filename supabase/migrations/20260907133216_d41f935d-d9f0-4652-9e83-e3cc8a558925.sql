-- allow acknowledgements to be recorded
CREATE POLICY acks_insert_authenticated ON public.hospital_acknowledgements
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS hospital_acks_unique
  ON public.hospital_acknowledgements (incident_id, hospital_id);

CREATE INDEX IF NOT EXISTS hospitals_location_gix
  ON public.hospitals USING gist (location);

-- hospitals within radius of an incident
CREATE OR REPLACE FUNCTION public.nearby_hospitals(_incident_id uuid, _radius_m double precision DEFAULT 5000)
RETURNS TABLE (id uuid, name text, contact_info text, is_connected boolean, distance_m double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.id, h.name, h.contact_info, h.is_connected,
         ST_Distance(h.location, i.location) AS distance_m
  FROM public.incidents i
  JOIN public.hospitals h ON h.location IS NOT NULL
  WHERE i.id = _incident_id
    AND i.location IS NOT NULL
    AND ST_DWithin(h.location, i.location, _radius_m)
  ORDER BY distance_m
$$;

-- active incidents within radius of a hospital
CREATE OR REPLACE FUNCTION public.hospital_incidents(_hospital_id uuid, _radius_m double precision DEFAULT 5000)
RETURNS TABLE (
  id uuid, category text, description text, priority text, status text,
  created_at timestamptz, distance_m double precision, acknowledged_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.category, i.description, i.priority, i.status, i.created_at,
         ST_Distance(i.location, h.location) AS distance_m,
         a.acknowledged_at
  FROM public.hospitals h
  JOIN public.incidents i
    ON i.location IS NOT NULL AND ST_DWithin(i.location, h.location, _radius_m)
  LEFT JOIN public.hospital_acknowledgements a
    ON a.incident_id = i.id AND a.hospital_id = h.id
  WHERE h.id = _hospital_id
    AND h.location IS NOT NULL
    AND i.status IN ('active', 'responding')
  ORDER BY i.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.nearby_hospitals(uuid, double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hospital_incidents(uuid, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nearby_hospitals(uuid, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hospital_incidents(uuid, double precision) TO authenticated;

-- sample hospitals in central Kolkata
INSERT INTO public.hospitals (name, location, is_connected, contact_info) VALUES
  ('Ruby General Hospital', 'SRID=4326;POINT(88.3958 22.5045)', true, '+91 33 3987 1800'),
  ('SSKM Hospital', 'SRID=4326;POINT(88.3428 22.5390)', true, '+91 33 2223 3526'),
  ('AMRI Hospital Dhakuria', 'SRID=4326;POINT(88.3646 22.5116)', true, '+91 33 6680 0000'),
  ('Apollo Multispeciality Hospital', 'SRID=4326;POINT(88.3990 22.5726)', true, '+91 33 2320 3040'),
  ('Belle Vue Clinic', 'SRID=4326;POINT(88.3520 22.5386)', false, '+91 33 2287 2321');