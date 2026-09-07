import { supabase } from "@/integrations/supabase/client";

export interface HospitalRow {
  id: string;
  name: string;
  is_connected: boolean;
  contact_info: string | null;
}

export interface HospitalIncident {
  id: string;
  category: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
  distance_m: number;
  acknowledged_at: string | null;
}

/** Hospitals the platform can dispatch to, connected ones first. */
export async function listHospitals(): Promise<HospitalRow[]> {
  const { data, error } = await supabase
    .from("hospitals")
    .select("id, name, is_connected, contact_info")
    .order("is_connected", { ascending: false })
    .order("name");
  if (error) {
    console.error("[hospitals] list failed", error.message);
    return [];
  }
  return data ?? [];
}

/** Connected hospitals within `radius` metres of an incident, closest first. */
export async function nearbyHospitals(incidentId: string, radiusM = 5000) {
  const { data, error } = await supabase.rpc("nearby_hospitals", {
    _incident_id: incidentId,
    _radius_m: radiusM,
  });
  if (error) {
    console.error("[hospitals] nearby lookup failed", error.message);
    return [];
  }
  return (data ?? []).filter((h) => h.is_connected);
}

/** Active incidents within `radius` metres of a hospital. */
export async function hospitalIncidents(
  hospitalId: string,
  radiusM = 5000,
): Promise<HospitalIncident[]> {
  const { data, error } = await supabase.rpc("hospital_incidents", {
    _hospital_id: hospitalId,
    _radius_m: radiusM,
  });
  if (error) {
    console.error("[hospitals] incident feed failed", error.message);
    return [];
  }
  return (data ?? []) as HospitalIncident[];
}

export async function acknowledgeIncident(hospitalId: string, incidentId: string) {
  const { error } = await supabase
    .from("hospital_acknowledgements")
    .insert({ hospital_id: hospitalId, incident_id: incidentId });
  if (error) console.error("[hospitals] acknowledge failed", error.message);
  return !error;
}

export function formatDistance(m: number) {
  return m < 950 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
