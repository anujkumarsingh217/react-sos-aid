import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Users } from "lucide-react";
import type { FormEvent } from "react";
import { MapPlaceholder } from "@/components/map-placeholder";
import { incidents } from "@/lib/mock-data";

export const Route = createFileRoute("/incident/$id")({
  head: () => ({
    meta: [
      { title: "Incident Room — Community SOS" },
      { name: "description", content: "Live incident room with map, responder chat, and status updates." },
      { property: "og:title", content: "Incident Room — Community SOS" },
      { property: "og:description", content: "Live incident room with map, responder chat, and status updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IncidentRoom,
});

function IncidentRoom() {
  const { id } = Route.useParams();
  const incident = incidents.find((i) => i.id === id) ?? incidents[0]!;

  const onSend = (e: FormEvent) => e.preventDefault(); // placeholder until chat is wired

  return (
    <div className="px-4 py-4">
      <Link to="/" className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <ArrowLeft className="size-3.5" /> Back to incidents
      </Link>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">{incident.title}</h1>
          <p className="text-xs text-muted-foreground">
            {incident.category} · {incident.location}
          </p>
        </div>
        <span className="rounded-full bg-sos/10 px-2.5 py-1 text-[10px] font-bold uppercase text-sos">
          {incident.severity}
        </span>
      </div>

      {/* Status line */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-info/30 bg-info-muted px-3 py-2 text-xs font-medium text-info">
        <span className="size-2 animate-pulse rounded-full bg-info" />
        Status: {incident.status === "active" ? "Awaiting more responders" : incident.status === "responding" ? "Help is on the way" : "Situation contained"}
        <span className="ml-auto flex items-center gap-1 text-muted-foreground">
          <Users className="size-3.5" /> {incident.responders}
        </span>
      </div>

      {/* Map */}
      <div className="mt-4">
        <MapPlaceholder label={`Map placeholder — incident ${incident.id}`} />
      </div>

      {/* Chat */}
      <section className="mt-4 pb-4" aria-labelledby="chat-heading">
        <h2 id="chat-heading" className="text-sm font-bold text-foreground">
          Responder chat
        </h2>
        <div className="mt-2 space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="max-w-[80%] rounded-lg bg-info-muted px-3 py-2 text-xs text-foreground">
            <span className="font-semibold text-info">Dispatch:</span> Ambulance ETA 6 minutes.
            Keep the area clear.
          </div>
          <div className="ml-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-xs text-foreground">
            <span className="font-semibold">You:</span> On site. Two bystanders assisting.
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Chat placeholder — real-time messaging connects here.
          </p>
        </div>
        <form onSubmit={onSend} className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder="Message responders…"
            className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:border-info focus:outline-none focus:ring-2 focus:ring-info/25"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="flex size-10 items-center justify-center rounded-xl bg-info text-info-foreground"
          >
            <Send className="size-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
