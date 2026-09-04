import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Briefcase, IdCard } from "lucide-react";
import { useEffect, useState } from "react";
import { SkillBadge } from "@/components/skill-badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Community SOS" },
      { name: "description", content: "Your Community SOS identity, verification badges, skills, and volunteer mode." },
      { property: "og:title", content: "My Profile — Community SOS" },
      { property: "og:description", content: "Your Community SOS identity, badges, skills, and volunteer mode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

interface ProfileRow {
  name: string;
  platform_user_id: string;
  profession: string | null;
  identity_verified: boolean;
  phone_verified: boolean;
}

interface SkillRow {
  id: string;
  skill_name: string;
  status: string;
}

function ProfilePage() {
  const { user } = useAuth();
  const [volunteerMode, setVolunteerMode] = useState(currentUser.volunteerMode);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [skills, setSkills] = useState<SkillRow[]>([]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setSkills([]);
      return;
    }
    let active = true;
    void (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase
          .from("users")
          .select("name, platform_user_id, profession, identity_verified, phone_verified")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_skills")
          .select("id, skill_name, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setProfile((p as ProfileRow) ?? null);
      setSkills((s as SkillRow[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const name = profile?.name ?? currentUser.name;
  const platformId = profile?.platform_user_id ?? currentUser.platformId;
  const profession = profile?.profession ?? (profile ? "Not set" : currentUser.profession);
  const badges = profile
    ? [
        ...(profile.identity_verified ? ["Identity Verified"] : []),
        ...(profile.phone_verified ? ["Phone Verified"] : []),
      ]
    : currentUser.badges;

  return (
    <div className="space-y-6 px-4 py-5">
      {/* Identity */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-info-muted text-lg font-bold text-info">
            {name.split(" ").map((n) => n[0]).join("")}
          </span>
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-bold text-card-foreground">
              {name}
              {(profile?.identity_verified ?? currentUser.verified) && (
                <BadgeCheck className="size-5 text-info" />
              )}
            </h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <IdCard className="size-3.5" /> Platform ID: {platformId}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Briefcase className="size-3.5" /> {profession}
            </p>
          </div>
        </div>
      </section>

      {/* Volunteer mode */}
      <section
        className={cn(
          "flex items-center justify-between rounded-xl border p-4 transition-colors",
          volunteerMode ? "border-safe/40 bg-safe/10" : "border-border bg-card"
        )}
      >
        <div>
          <h2 className="text-sm font-bold text-foreground">Volunteer Mode</h2>
          <p className="text-xs text-muted-foreground">
            {volunteerMode
              ? "You're visible to nearby SOS alerts"
              : "Turn on to receive nearby alerts"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={volunteerMode}
          onClick={() => setVolunteerMode((v) => !v)}
          className={cn(
            "relative h-7 w-12 rounded-full transition-colors",
            volunteerMode ? "bg-safe" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-6 rounded-full bg-card shadow transition-all",
              volunteerMode ? "left-[22px]" : "left-0.5"
            )}
          />
        </button>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-sm font-bold text-foreground">Verification badges</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {badges.length === 0 && (
            <p className="text-xs text-muted-foreground">No verifications yet.</p>
          )}
          {badges.map((badge) => (
            <span
              key={badge}
              className="flex items-center gap-1 rounded-full bg-info-muted px-3 py-1.5 text-xs font-medium text-info"
            >
              <BadgeCheck className="size-3.5" />
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="pb-4">
        <h2 className="text-sm font-bold text-foreground">Skills</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile ? (
            skills.length ? (
              skills.map((s) => (
                <SkillBadge key={s.id} name={s.skill_name} status={s.status} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No skills added yet.</p>
            )
          ) : (
            currentUser.skills.map((skill) => (
              <SkillBadge key={skill} name={skill} status="self_declared" />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
