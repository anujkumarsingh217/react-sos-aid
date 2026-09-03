import { useState } from "react";
import { cn } from "@/lib/utils";

/** Big emergency trigger. Currently simulated — wire to a real alert API later. */
export function SosButton() {
  const [pressed, setPressed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <button
        type="button"
        onClick={() => setPressed((p) => !p)}
        aria-pressed={pressed}
        className={cn(
          "relative flex size-44 flex-col items-center justify-center rounded-full",
          "bg-sos text-sos-foreground shadow-[0_12px_40px_-8px] shadow-sos/50",
          "transition-transform active:scale-95",
          !pressed && "before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-sos/25 before:[animation-duration:2s]",
          pressed && "bg-sos-deep"
        )}
      >
        <span className="text-3xl font-black tracking-widest">SOS</span>
        <span className="mt-1 text-[11px] font-semibold tracking-wider uppercase opacity-90">
          {pressed ? "Alert sent — help is coming" : "Press for help"}
        </span>
      </button>
      {pressed && (
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Placeholder: your location and alert would be broadcast to nearby volunteers and hospitals
          here.
        </p>
      )}
    </div>
  );
}
