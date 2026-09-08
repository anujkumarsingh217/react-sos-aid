import { supabase } from "@/integrations/supabase/client";

export interface ActiveIncident {
  id: string;
  category: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
  reporter_id: string;
}

/** Newest active/responding incidents across the network. */
export async function listActiveIncidents(limit = 10): Promise<ActiveIncident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("id, category, description, priority, status, created_at, reporter_id")
    .in("status", ["active", "responding"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[incidents] list failed", error.message);
    return [];
  }
  return data ?? [];
}

/** Closes every still-open incident reported by this user (demo cleanup). */
export async function resolveMyOpenIncidents(userId: string) {
  const { data, error } = await supabase
    .from("incidents")
    .update({ status: "resolved" })
    .eq("reporter_id", userId)
    .in("status", ["active", "responding"])
    .select("id");
  if (error) {
    console.error("[incidents] cleanup failed", error.message);
    return { ok: false, count: 0 };
  }
  return { ok: true, count: data?.length ?? 0 };
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
}
