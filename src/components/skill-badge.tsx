import { ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SkillBadgeProps {
  name: string;
  status: string;
}

/**
 * Certified skills read as solid, verified chips; self-declared skills stay
 * deliberately lighter with a dashed outline so the difference is obvious.
 */
export function SkillBadge({ name, status }: SkillBadgeProps) {
  const certified = status === "certified";
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        certified
          ? "bg-safe text-safe-foreground shadow-sm ring-2 ring-safe/30"
          : "border border-dashed border-info/50 bg-info-muted text-info",
      )}
    >
      {certified ? (
        <ShieldCheck className="size-3.5 shrink-0" />
      ) : (
        <UserRound className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{name}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase",
          certified ? "bg-safe-foreground/20" : "bg-info/10",
        )}
      >
        {certified ? "Certified" : "Self-declared"}
      </span>
    </span>
  );
}
