import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { IncidentCard } from "@/components/incident-card";
import { SosButton } from "@/components/sos-button";
import { incidents } from "@/lib/mock-data";

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

function HomePage() {
  return (
    <div className="px-4">
      <SosButton />

      <section aria-labelledby="nearby-heading">
        <div className="flex items-center justify-between">
          <h2 id="nearby-heading" className="text-base font-bold text-foreground">
            Nearby active incidents
          </h2>
          <span className="flex items-center text-xs font-medium text-info">
            View all <ChevronRight className="size-3.5" />
          </span>
        </div>
        <div className="mt-3 space-y-3 pb-6">
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      </section>

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
    </div>
  );
}
