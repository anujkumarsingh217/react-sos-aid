import { supabase } from "@/integrations/supabase/client";

/** Skills that matter for each emergency category (null = any skill counts). */
export const CATEGORY_SKILLS: Record<string, string[] | null> = {
  "Road Accident": ["First Aid", "CPR", "Driving"],
  "Medical Emergency": ["First Aid", "CPR", "Medical Professional"],
  Fire: ["Firefighting", "First Aid"],
  Flood: ["Search & Rescue", "Swimming"],
  "Building Collapse": ["Search & Rescue", "First Aid"],
  "Missing Person": ["Search & Rescue"],
  "Public Safety": null,
  Other: null,
};

export function getBrowserPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

/** Persist volunteer mode + last known location so nearby matching can find them. */
export async function saveVolunteerStatus(userId: string, isVolunteer: boolean) {
  const coords = isVolunteer ? await getBrowserPosition() : null;
  const { error } = await supabase.from("volunteer_status").upsert(
    {
      user_id: userId,
      is_volunteer: isVolunteer,
      availability: isVolunteer ? "available" : "unavailable",
      last_updated: new Date().toISOString(),
      ...(coords ? { location: `SRID=4326;POINT(${coords.lng} ${coords.lat})` } : {}),
    },
    { onConflict: "user_id" },
  );
  if (error) console.error("[volunteer] status save failed", error.message);
  return { ok: !error, located: Boolean(coords) };
}

/** Ask the backend to alert the 5 closest matching volunteers within 2km. */
export async function notifyNearbyVolunteers(incidentId: string) {
  const { data, error } = await supabase.rpc("match_volunteers", {
    _incident_id: incidentId,
  });
  if (error) {
    console.error("[volunteer] matching failed", error.message);
    return [];
  }
  return data ?? [];
}
