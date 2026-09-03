import { Link } from "@tanstack/react-router";
import { MapPin, Users } from "lucide-react";
import type { Incident } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const severityStyles: Record<Incident["severity"], string> = {
  critical: "bg-sos/10 text-sos",
  high: "bg-warning/20 text-warning-foreground",
  moderate: "bg-info-muted text-info",
};

const statusLabel: Record<Incident["status"], string> = {
  active: "Needs responders",
  responding: "Help en route",
  contained: "Contained",
};

export function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <Link
      to="/incident/$id"
      params={{ id: incident.id }}
      className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-info/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-card-foreground">{incident.title}</p>
          <p className="text-xs text-muted-foreground">{incident.category}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
            severityStyles[incident.severity]
          )}
        >
          {incident.severity}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" />
          {incident.distance} · {incident.location}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Users className="size-3.5" />
          {incident.responders} responders
        </span>
        <span className="font-medium text-info">{statusLabel[incident.status]}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">Reported {incident.reportedAt}</p>
    </Link>
  );
}
