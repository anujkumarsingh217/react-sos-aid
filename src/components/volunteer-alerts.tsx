import { useNavigate } from "@tanstack/react-router";
import { MapPin, Siren } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface AlertRow {
  id: string;
  incident_id: string | null;
  distance_m: number | null;
  incidents: {
    id: string;
    category: string;
    description: string | null;
    priority: string;
  } | null;
}

const SELECT =
  "id, incident_id, distance_m, incidents(id, category, description, priority)";

/** Live "you're needed nearby" cards for volunteers matched to a new incident. */
export function VolunteerAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select(SELECT)
      .eq("user_id", user.id)
      .eq("type", "volunteer_request")
      .eq("response", "pending")
      .order("created_at", { ascending: false })
      .limit(3);
    setAlerts((data as unknown as AlertRow[]) ?? []);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      return;
    }
    void load();
    const channel = supabase
      .channel(`volunteer-alerts-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  const respond = async (alert: AlertRow, accepted: boolean) => {
    if (!user) return;
    setBusy(alert.id);
    await supabase
      .from("notifications")
      .update({ response: accepted ? "accepted" : "declined", read: true })
      .eq("id", alert.id);

    if (accepted && alert.incident_id) {
      const { error } = await supabase.from("incident_participants").insert({
        incident_id: alert.incident_id,
        user_id: user.id,
        role: "volunteer",
      });
      if (error && !error.message.includes("duplicate")) {
        console.error("[volunteer] join failed", error.message);
      }
    }
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    setBusy(null);

    if (accepted && alert.incident_id) {
      toast.success("You're on the way — joining the incident room.");
      navigate({ to: "/incident/$id", params: { id: alert.incident_id } });
    } else {
      toast("Marked as not available.");
    }
  };

  if (!alerts.length) return null;

  return (
    <div className="space-y-3 px-4 pt-4">
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-sos/40 bg-sos/5 p-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-sos uppercase">
            <Siren className="size-4 animate-pulse" />
            Help needed nearby
            {alert.distance_m != null && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-muted-foreground normal-case">
                <MapPin className="size-3" />
                {Math.round(alert.distance_m)} m away
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-bold text-foreground">
            {alert.incidents?.category ?? "Emergency"}
            {alert.incidents?.priority && (
              <span className="ml-2 rounded-full bg-sos/15 px-2 py-0.5 text-[10px] font-semibold text-sos uppercase">
                {alert.incidents.priority}
              </span>
            )}
          </h3>
          {alert.incidents?.description && (
            <p className="mt-1 text-xs text-muted-foreground">{alert.incidents.description}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy === alert.id}
              onClick={() => void respond(alert, false)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground disabled:opacity-60"
            >
              Not Available
            </button>
            <button
              type="button"
              disabled={busy === alert.id}
              onClick={() => void respond(alert, true)}
              className="flex-[2] rounded-xl bg-sos py-2.5 text-sm font-bold text-sos-foreground disabled:opacity-60"
            >
              Offer Assistance
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
