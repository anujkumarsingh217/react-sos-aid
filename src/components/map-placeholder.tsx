import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/** Placeholder block where a live map (e.g. Mapbox/Google Maps) will mount. */
export function MapPlaceholder({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-56 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-border bg-info-muted",
        className
      )}
    >
      {/* faux grid to suggest a map */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <span className="relative flex size-10 items-center justify-center rounded-full bg-sos shadow-lg">
        <MapPin className="size-5 text-sos-foreground" />
      </span>
      <p className="relative text-xs font-medium text-muted-foreground">
        {label ?? "Live map placeholder"}
      </p>
    </div>
  );
}
