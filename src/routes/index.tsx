import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Loader2, MapPin, Radio, Siren, Sparkles, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SosButton } from "@/components/sos-button";
import { useAuth } from "@/hooks/use-auth";
import {
  listActiveIncidents,
  resolveMyOpenIncidents,
  timeAgo,
  type ActiveIncident,
} from "@/lib/incidents";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Community SOS — Real-time Emergency Coordination" },
      {
        name: "description",
        content:
          "Press one button to alert nearby volunteers and hospitals. Community SOS coordinates real-time emergency response in your neighborhood.",
      },
      { property: "og:title", content: "Community SOS — Real-time Emergency Coordination" },
      {
        property: "og:description",
        content: "Press one button to alert nearby volunteers and hospitals in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const steps = [
  { icon: Siren, label: "Report", copy: "One press shares your location and emergency type." },
  { icon: Sparkles, label: "Match", copy: "We find nearby volunteers with the right skills." },
  { icon: Bell, label: "Notify", copy: "They and nearby hospitals get alerted instantly." },
  { icon: Radio, label: "Coordinate", copy: "Everyone meets in one live incident room." },
] as const;

const priorityStyles: Record<string, string> = {
  critical: "bg-sos/10 text-sos",
  high: "bg-warning/20 text-warning-foreground",
  medium: "bg-info-muted text-info",
};

function HomePage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<ActiveIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const load = useCallback(async () => {
    const rows = await listActiveIncidents();
    setIncidents(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mineOpen = user ? incidents.filter((i) => i.reporter_id === user.id).length : 0;

  const onCleanup = async () => {
    if (!user) return;
    setCleaning(true);
    const { ok, count } = await resolveMyOpenIncidents(user.id);
    setCleaning(false);
    if (!ok) {
      toast.error("Couldn't clear those reports. Please try again.");
      return;
    }
    toast.success(count ? `Marked ${count} of your reports resolved.` : "Nothing left to clear.");
    setLoading(true);
    void load();
  };

  return (
    <div className="px-4">
      {/* Pitch for first-time viewers */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm leading-snug font-bold text-card-foreground">
          Don&apos;t just report an emergency. Coordinate the right help around it.
        </p>
        <ol className="mt-3 grid grid-cols-2 gap-2.5">
          {steps.map(({ icon: Icon, label, copy }, i) => (
            <li key={label} className="min-w-0 rounded-xl bg-muted/50 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-info-muted text-[10px] font-black text-info">
                  {i + 1}
                </span>
                <Icon className="size-3.5 shrink-0 text-info" />
                <span className="truncate text-xs font-bold text-foreground">{label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <SosButton />

      <section aria-labelledby="nearby-heading">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 id="nearby-heading" className="truncate text-base font-bold text-foreground">
            Nearby active incidents
          </h2>
          {!loading && incidents.length > 0 && (
            <span className="shrink-0 rounded-full bg-sos/10 px-2 py-0.5 text-[11px] font-bold text-sos">
              {incidents.length} live
            </span>
          )}
        </div>

        <div className="mt-3 space-y-3 pb-4">
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-border bg-muted/50"
                />
              ))}
            </>
          ) : incidents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-safe/15">
                <MapPin className="size-5 text-safe" />
              </span>
              <p className="mt-2 text-sm font-semibold text-foreground">
                No active incidents nearby
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                All clear right now. Press SOS above if you need help.
              </p>
            </div>
          ) : (
            incidents.map((incident) => (
              <Link
                key={incident.id}
                to="/incident/$id"
                params={{ id: incident.id }}
                className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-info/40"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                      {incident.category}
                    </p>
                    {incident.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {incident.description}
                      </p>
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
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {incident.status === "responding" ? "Help en route" : "Needs responders"}
                  </span>
                  <span>Reported {timeAgo(incident.created_at)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {user && mineOpen > 0 && (
          <button
            type="button"
            onClick={() => void onCleanup()}
            disabled={cleaning}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-sos disabled:opacity-60"
          >
            {cleaning ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Mark all my old test incidents as resolved ({mineOpen})
          </button>
        )}
      </section>

      {!user && (
        <p className="pb-6 text-center text-xs text-muted-foreground">
          Not registered?{" "}
          <Link to="/login" className="font-medium text-info">
            Sign in
          </Link>{" "}
          or{" "}
          <Link to="/register" className="font-medium text-info">
            join as a volunteer
          </Link>
        </p>
      )}
    </div>
  );
}
