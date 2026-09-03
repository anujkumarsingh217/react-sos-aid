import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { IncidentCard } from "@/components/incident-card";
import { incidents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hospital-dashboard")({
  head: () => ({
    meta: [
      { title: "Hospital Dashboard — Community SOS" },
      { name: "description", content: "Incoming emergency alerts for connected hospitals. Acknowledge and dispatch." },
      { property: "og:title", content: "Hospital Dashboard — Community SOS" },
      { property: "og:description", content: "Incoming emergency alerts for connected hospitals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HospitalDashboard,
});

function HospitalDashboard() {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const acknowledge = (id: string) =>
    setAcknowledged((prev) => new Set(prev).add(id));

  return (
    <div className="px-4 py-5">
      <h1 className="text-lg font-bold text-foreground">Incoming incidents</h1>
      <p className="text-xs text-muted-foreground">
        Ruby General Hospital · placeholder feed — live dispatch connects here.
      </p>

      <div className="mt-4 space-y-4 pb-6">
        {incidents.map((incident) => {
          const acked = acknowledged.has(incident.id);
          return (
            <div key={incident.id} className="rounded-xl border border-border bg-card">
              <IncidentCard incident={incident} />
              <div className="border-t border-border p-3">
                <button
                  type="button"
                  disabled={acked}
                  onClick={() => acknowledge(incident.id)}
                  className={cn(
                    "w-full rounded-lg py-2 text-sm font-bold transition-opacity",
                    acked
                      ? "cursor-default bg-safe/15 text-safe"
                      : "bg-info text-info-foreground hover:opacity-90"
                  )}
                >
                  {acked ? "✓ Acknowledged — dispatching" : "Acknowledge"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
