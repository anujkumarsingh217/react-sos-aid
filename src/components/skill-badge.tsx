import { BadgeCheck, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SkillBadgeProps {
  name: string;
  status: string;
}

export function SkillBadge({ name, status }: SkillBadgeProps) {
  const certified = status === "certified";
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold",
        certified
          ? "bg-safe text-safe-foreground"
          : "bg-info-muted text-info"
      )}
    >
      {certified ? <BadgeCheck className="size-3.5" /> : <CircleUser className="size-3.5" />}
      {name}
      <span className="opacity-70">· {certified ? "Certified" : "Self-Declared"}</span>
    </span>
  );
}
