import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, LocateFixed, MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { notifyNearbyVolunteers } from "@/lib/volunteer";

const CATEGORIES = [
  "Road Accident",
  "Medical Emergency",
  "Fire",
  "Flood",
  "Building Collapse",
  "Missing Person",
  "Public Safety",
  "Other",
] as const;

const CRITICAL_WORDS = ["unconscious", "trapped", "not breathing"];

function assignPriority(category: string, description: string): "critical" | "high" | "medium" {
  const text = description.toLowerCase();
  if (
    category === "Fire" ||
    category === "Building Collapse" ||
    CRITICAL_WORDS.some((w) => text.includes(w))
  ) {
    return "critical";
  }
  if (category === "Medical Emergency" || category === "Road Accident") return "high";
  return "medium";
}

type Step = "idle" | "locating" | "form" | "submitting";

/** Emergency trigger: captures location, collects details, files an incident. */
export function SosButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");

  const handlePress = () => {
    if (!user) {
      toast.error("Please sign in to send an SOS alert.");
      navigate({ to: "/login" });
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser.");
      setStep("form");
      return;
    }
    setStep("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStep("form");
      },
      (err) => {
        console.warn("[sos] geolocation failed", err.message);
        toast.warning("Couldn't get your location — sending without it.");
        setCoords(null);
        setStep("form");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setStep("submitting");
    const priority = assignPriority(category, description);
    const { data, error } = await supabase
      .from("incidents")
      .insert({
        reporter_id: user.id,
        category,
        description: description.trim() || null,
        priority,
        status: "active",
        ...(coords
          ? { location: `SRID=4326;POINT(${coords.lng} ${coords.lat})` }
          : {}),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[sos] incident insert failed", error?.message);
      toast.error("Couldn't send the alert. Please try again.");
      setStep("form");
      return;
    }

    // Reporter auto-joins their own incident room.
    await supabase.from("incident_participants").insert({
      incident_id: data.id,
      user_id: user.id,
      role: "reporter",
    });

    // Alert the closest matching volunteers within 2km.
    const matched = await notifyNearbyVolunteers(data.id);
    toast.success(
      matched.length
        ? `SOS sent — alerting ${matched.length} nearby volunteer${matched.length > 1 ? "s" : ""}.`
        : "SOS sent — help is being coordinated.",
    );
    reset();
    navigate({ to: "/incident/$id", params: { id: data.id } });
  };

  const reset = () => {
    setStep("idle");
    setDescription("");
    setCategory(CATEGORIES[0]);
  };

  const busy = step === "locating" || step === "submitting";

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <button
        type="button"
        onClick={handlePress}
        disabled={busy}
        className={cn(
          "relative flex size-44 flex-col items-center justify-center rounded-full",
          "bg-sos text-sos-foreground shadow-[0_12px_40px_-8px] shadow-sos/50",
          "transition-transform active:scale-95 disabled:opacity-80",
          step === "idle" &&
            "before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-sos/25 before:[animation-duration:2s]",
        )}
      >
        {step === "locating" ? (
          <>
            <LocateFixed className="size-8 animate-pulse" />
            <span className="mt-2 text-[11px] font-semibold tracking-wider uppercase opacity-90">
              Getting location…
            </span>
          </>
        ) : step === "submitting" ? (
          <>
            <Loader2 className="size-8 animate-spin" />
            <span className="mt-2 text-[11px] font-semibold tracking-wider uppercase opacity-90">
              Sending alert…
            </span>
          </>
        ) : (
          <>
            <span className="text-3xl font-black tracking-widest">SOS</span>
            <span className="mt-1 text-[11px] font-semibold tracking-wider uppercase opacity-90">
              Press for help
            </span>
          </>
        )}
      </button>

      {step === "form" && (
        <form
          onSubmit={handleSubmit}
          className="w-full space-y-3 rounded-xl border border-sos/30 bg-card p-4"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-sos">
            <AlertTriangle className="size-4" />
            What's the emergency?
            {coords && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <MapPin className="size-3" />
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="sos-category" className="text-xs font-medium text-foreground">
              Category
            </label>
            <select
              id="sos-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:border-sos focus:outline-none focus:ring-2 focus:ring-sos/25"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sos-description" className="text-xs font-medium text-foreground">
              Short description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="sos-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="e.g. Two cars collided, one person unconscious…"
              className="mt-1 w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:border-sos focus:outline-none focus:ring-2 focus:ring-sos/25"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] rounded-xl bg-sos py-2.5 text-sm font-bold text-sos-foreground"
            >
              Send SOS alert
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
