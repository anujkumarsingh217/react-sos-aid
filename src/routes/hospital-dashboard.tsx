import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Radio, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  acknowledgeIncident,
  formatDistance,
  hospitalIncidents,
  listHospitals,
  type HospitalIncident,
  type HospitalRow,
} from "@/lib/hospitals";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hospital-dashboard")({
  head: () => ({
    meta: [
      { title: "Hospital Dashboard — Community SOS" },
      {
        name: "description",
        content:
          "Live emergency alerts within 5 km of your hospital. Acknowledge incidents and dispatch care.",
      },
      { property: "og:title", content: "Hospital Dashboard — Community SOS" },
      {
        property: "og:description",
        content: "Live emergency alerts within 5 km of your hospital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HospitalDashboard,
});

const priorityStyles: Record<string, string> = {
  critical: "bg-sos/10 text-sos",
  high: "bg-warning/20 text-warning-foreground",
  medium: "bg-info-muted text-info",
};

function HospitalDashboard() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [hospitalId, setHospitalId] = useState<string>("");
  const [incidents, setIncidents] = useState<HospitalIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const hospital = hospitals.find((h) => h.id === hospitalId) ?? null;

  useEffect(() => {
    void (async () => {
      const rows = await listHospitals();
      setHospitals(rows);
      const connected = rows.find((h) => h.is_connected);
      if (connected) setHospitalId(connected.id);
      else setLoading(false);
    })();
  }, [user]);

  const refresh = useCallback(
    async (announce = false) => {
      if (!hospitalId) return;
      const rows = await hospitalIncidents(hospitalId);
      setIncidents((prev) => {
        if (announce && rows.length > prev.length) {
          const fresh = rows.find((r) => !prev.some((p) => p.id === r.id));
          if (fresh) {
            toast.error(`New ${fresh.category} — ${formatDistance(fresh.distance_m)} away`);
          }
        }
        return rows;
      });
      setLoading(false);
    },
    [hospitalId],
  );

  useEffect(() => {
    if (!hospitalId) return;
    setLoading(true);
    void refresh();

    const channel = supabase
      .channel(`hospital-feed-${hospitalId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        () => void refresh(true),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hospitalId, refresh]);

  const onAcknowledge = async (incidentId: string) => {
    if (!hospitalId) return;
    setPending(incidentId);
    const ok = await acknowledgeIncident(hospitalId, incidentId);
    setPending(null);
    if (!ok) {
      toast.error("Couldn't record the acknowledgement. Please sign in and try again.");
      return;
    }
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId ? { ...i, acknowledged_at: new Date().toISOString() } : i,
      ),
    );
    toast.success("Acknowledged — dispatch team notified.");
  };

  return (
    <div className="px-4 py-5">
      <h1 className="text-lg font-bold text-foreground">Incoming incidents</h1>
      <p className="text-xs text-muted-foreground">
        Live emergencies reported within 5 km of your hospital.
      </p>

      <label htmlFor="hospital-select" className="mt-4 block text-xs font-medium text-foreground">
        Hospital
      </label>
      <select
        id="hospital-select"
        value={hospitalId}
        onChange={(e) => setHospitalId(e.target.value)}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:border-info focus:outline-none focus:ring-2 focus:ring-info/25"
      >
        {hospitals.length === 0 && <option value="">No hospitals registered</option>}
        {hospitals.map((h) => (
          <option key={h.id} value={h.id} disabled={!h.is_connected}>
            {h.name}
            {h.is_connected ? " — connected" : " — not connected"}
          </option>
        ))}
      </select>

      {/* Network roster: connected vs non-connected at a glance */}
      <div className="mt-3 flex flex-wrap gap-2">
        {hospitals.length === 0 && (
          <p className="text-[11px] text-muted-foreground">Loading hospital network…</p>
        )}
        {hospitals.map((h) => (
          <span
            key={h.id}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              h.is_connected
                ? "bg-safe/15 text-safe ring-1 ring-safe/40"
                : "border border-dashed border-border bg-muted text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                h.is_connected ? "animate-pulse bg-safe" : "bg-muted-foreground/50",
              )}
            />
            <span className="truncate">{h.name}</span>
            <span className="shrink-0 opacity-80">
              {h.is_connected ? "Live" : "Offline"}
            </span>
          </span>
        ))}
      </div>

      {hospital && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-info">
          <Radio className="size-3.5 animate-pulse" />
          Live feed connected{hospital.contact_info ? ` · ${hospital.contact_info}` : ""}
        </p>
      )}


      <div className="mt-4 space-y-4 pb-6">
        {loading ? (
          [0, 1].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-border bg-muted/50"
            />
          ))
        ) : incidents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-safe/15">
              <Radio className="size-5 text-safe" />
            </span>
            <p className="mt-2 text-sm font-semibold text-foreground">No incoming emergencies</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nothing active within 5 km. New alerts appear here instantly.
            </p>
          </div>
        ) : (
          incidents.map((incident) => {
            const acked = Boolean(incident.acknowledged_at);
            return (
              <div key={incident.id} className="rounded-xl border border-border bg-card">
                <Link
                  to="/incident/$id"
                  params={{ id: incident.id }}
                  className="block p-4 transition-colors hover:border-info/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">
                        {incident.category}
                      </p>
                      {incident.description && (
                        <p className="text-xs text-muted-foreground">{incident.description}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                        priorityStyles[incident.priority] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {incident.priority}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {formatDistance(incident.distance_m)} away
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {incident.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Reported {new Date(incident.created_at).toLocaleTimeString()}
                  </p>
                </Link>
                <div className="border-t border-border p-3">
                  <button
                    type="button"
                    disabled={acked || pending === incident.id}
                    onClick={() => void onAcknowledge(incident.id)}
                    className={cn(
                      "w-full rounded-lg py-2 text-sm font-bold transition-opacity",
                      acked
                        ? "cursor-default bg-safe/15 text-safe"
                        : "bg-info text-info-foreground hover:opacity-90 disabled:opacity-60",
                    )}
                  >
                    {acked
                      ? "✓ Acknowledged — dispatching"
                      : pending === incident.id
                        ? "Acknowledging…"
                        : "Acknowledge"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
