import { createFileRoute } from "@tanstack/react-router";
import { Ambulance, Flag, Siren, Users } from "lucide-react";
import { MapPlaceholder } from "@/components/map-placeholder";
import { adminStats } from "@/lib/mock-data";
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

const toneIcons = { sos: Siren, safe: Users, info: Ambulance, warning: Flag } as const;

function AdminDashboard() {
  return (
    <div className="px-4 py-5">
      <h1 className="text-lg font-bold text-foreground">Network overview</h1>
      <p className="text-xs text-muted-foreground">Placeholder metrics — live data connects here.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {adminStats.map((stat) => {
          const Icon = toneIcons[stat.tone];
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  toneStyles[stat.tone]
                )}
              >
                <Icon className="size-4.5" />
              </span>
              <p className="mt-3 text-2xl font-black text-card-foreground">{stat.value}</p>
              <p className="text-xs font-medium text-foreground">{stat.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.delta}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pb-6">
        <h2 className="text-sm font-bold text-foreground">Live incident map</h2>
        <MapPlaceholder className="mt-2 h-64" label="City-wide incident map placeholder" />
      </div>
    </div>
  );
}
