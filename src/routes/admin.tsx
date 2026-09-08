import { createFileRoute, Link } from "@tanstack/react-router";
import { Ambulance, Flag, Loader2, ShieldAlert, Siren, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { MapPlaceholder } from "@/components/map-placeholder";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchActiveIncidents,
  fetchAdminStats,
  isAdminUser,
  type ActiveIncidentSummary,
  type AdminStats,
} from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Community SOS" },
      { name: "description", content: "Network-wide overview: active emergencies, volunteers, hospitals, and flagged reports." },
      { property: "og:title", content: "Admin Dashboard — Community SOS" },
      { property: "og:description", content: "Network-wide emergency coordination overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

const toneStyles = {
  sos: "bg-sos/10 text-sos",
  safe: "bg-safe/15 text-safe",
  info: "bg-info-muted text-info",
  warning: "bg-warning/20 text-warning-foreground",
} as const;

type Tone = keyof typeof toneStyles;

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [incidents, setIncidents] = useState<ActiveIncidentSummary[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAllowed(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const ok = await isAdminUser(user.id);
      if (cancelled) return;
      setAllowed(ok);
      if (!ok) return;
      const [s, list] = await Promise.all([fetchAdminStats(), fetchActiveIncidents()]);
      if (cancelled) return;
      setStats(s);
      setIncidents(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || allowed === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="px-4 py-10 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-sos/10">
          <ShieldAlert className="size-5 text-sos" />
        </span>
        <h1 className="mt-3 text-base font-bold text-foreground">Admins only</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {user
            ? "This account does not have administrator access."
            : "Sign in with an administrator account to view this dashboard."}
        </p>
        {!user && (
          <Link
            to="/login"
            className="mt-4 inline-block rounded-full bg-info px-4 py-2 text-xs font-semibold text-info-foreground"
          >
            Sign in
          </Link>
        )}
      </div>
    );
  }

  const cards: { label: string; value: number; tone: Tone; icon: typeof Siren }[] = [
    { label: "Active Emergencies", value: stats?.activeEmergencies ?? 0, tone: "sos", icon: Siren },
    { label: "Volunteers Online", value: stats?.volunteersOnline ?? 0, tone: "safe", icon: Users },
    { label: "Connected Hospitals", value: stats?.connectedHospitals ?? 0, tone: "info", icon: Ambulance },
    { label: "Flagged Reports", value: stats?.flaggedReports ?? 0, tone: "warning", icon: Flag },
  ];

  return (
    <div className="px-4 py-5">
      <h1 className="text-lg font-bold text-foreground">Network overview</h1>
      <p className="text-xs text-muted-foreground">Live numbers from across the network.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {cards.map(({ label, value, tone, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <span className={cn("flex size-9 items-center justify-center rounded-lg", toneStyles[tone])}>
              <Icon className="size-4.5" />
            </span>
            <p className="mt-3 text-2xl font-black text-card-foreground">
              {stats ? value : "—"}
            </p>
            <p className="text-xs font-medium text-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 pb-6">
        <h2 className="text-sm font-bold text-foreground">Live incident map</h2>
        <MapPlaceholder
          className="mt-2 h-64"
          label={`City-wide map — ${incidents.length} active incident${incidents.length === 1 ? "" : "s"}`}
        />
        <ul className="mt-3 space-y-2">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <Link
                to="/incident/$id"
                params={{ id: incident.id }}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <span className="text-xs font-semibold text-card-foreground">{incident.category}</span>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {incident.priority} · {incident.status}
                </span>
              </Link>
            </li>
          ))}
          {incidents.length === 0 && (
            <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              No active incidents right now.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
