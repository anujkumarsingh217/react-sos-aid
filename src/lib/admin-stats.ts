import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  activeEmergencies: number;
  volunteersOnline: number;
  connectedHospitals: number;
  flaggedReports: number;
}

export interface ActiveIncidentSummary {
  id: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

/** True when the signed-in user is flagged as an administrator. */
export async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.is_admin);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [active, volunteers, hospitals, flagged] = await Promise.all([
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "responding"]),
    supabase
      .from("volunteer_status")
      .select("user_id", { count: "exact", head: true })
      .eq("is_volunteer", true)
      .eq("availability", "available"),
    supabase
      .from("hospitals")
      .select("id", { count: "exact", head: true })
      .eq("is_connected", true),
    supabase.from("incidents").select("id", { count: "exact", head: true }).eq("flagged", true),
  ]);

  return {
    activeEmergencies: active.count ?? 0,
    volunteersOnline: volunteers.count ?? 0,
    connectedHospitals: hospitals.count ?? 0,
    flaggedReports: flagged.count ?? 0,
  };
}

export async function fetchActiveIncidents(): Promise<ActiveIncidentSummary[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("id, category, priority, status, created_at")
    .in("status", ["active", "responding"])
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}
