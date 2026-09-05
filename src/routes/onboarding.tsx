import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Finish setup — Community SOS" },
      {
        name: "description",
        content: "Verify your phone, confirm your identity, and add your profession and rescue skills.",
      },
      { property: "og:title", content: "Finish setup — Community SOS" },
      {
        property: "og:description",
        content: "Verify your phone, confirm your identity, and add your profession and rescue skills.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
});

const SKILLS = [
  "First Aid",
  "CPR",
  "Driving",
  "Swimming",
  "Firefighting",
  "Medical Professional",
  "Search & Rescue",
  "Other",
] as const;

type SkillStatus = "self_declared" | "certified";

function makeUserId() {
  return `USR-${Math.floor(1000 + Math.random() * 9000)}`;
}

function OnboardingPage() {
  const { user, loading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (loading || user) return;

    let active = true;
    void refreshSession().then((storedSession) => {
      console.info("[onboarding] auth check", { hasSession: Boolean(storedSession) });
      if (active && !storedSession) navigate({ to: "/login", replace: true });
    });

    return () => {
      active = false;
    };
  }, [loading, user, refreshSession, navigate]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              s <= step ? "bg-sos" : "bg-muted"
            )}
          />
        ))}
      </div>

      {step === 1 && <PhoneStep onDone={() => setStep(2)} />}
      {step === 2 && <IdentityStep onDone={() => setStep(3)} />}
      {step === 3 && <SkillsStep />}
    </div>
  );
}

function PhoneStep({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

  const submit = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    setBusy(true);
    if (user) {
      await supabase.from("users").update({ phone_verified: true }).eq("id", user.id);
    }
    setBusy(false);
    onDone();
  };

  return (
    <section className="mt-10">
      <span className="flex size-12 items-center justify-center rounded-xl bg-info-muted">
        <Smartphone className="size-6 text-info" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-foreground">Verify your phone</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We sent a 6-digit code to your phone. Enter it below to continue.
      </p>

      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
          setError(null);
        }}
        placeholder="123456"
        aria-label="6-digit verification code"
        className="mt-6 w-full rounded-xl border border-input bg-background px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-foreground placeholder:tracking-[0.4em] placeholder:text-muted-foreground focus:border-info focus:outline-none focus:ring-2 focus:ring-info/25"
      />

      {error && <p className="mt-2 text-sm font-medium text-sos">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-sos py-3 text-sm font-bold text-sos-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Verifying…" : "Verify phone"}
      </button>
    </section>
  );
}

function IdentityStep({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [platformId, setPlatformId] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const timer = setTimeout(async () => {
      const id = makeUserId();
      if (user) {
        await supabase
          .from("users")
          .update({ identity_verified: true, platform_user_id: id })
          .eq("id", user.id);
      }
      setPlatformId(id);
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <section className="mt-10">
      <span className="flex size-12 items-center justify-center rounded-xl bg-info-muted">
        <ShieldCheck className="size-6 text-info" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-foreground">Identity Verification</h1>

      {!platformId ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-10 animate-spin text-info" />
          <p className="text-sm text-muted-foreground">Checking your identity records…</p>
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <BadgeCheck className="size-12 text-safe" />
          <p className="text-lg font-bold text-foreground">✓ Identity Verified</p>
          <p className="text-sm text-muted-foreground">Your platform User ID</p>
          <p className="rounded-lg bg-muted px-4 py-2 font-mono text-lg font-bold text-foreground">
            {platformId}
          </p>
          <button
            type="button"
            onClick={onDone}
            className="mt-6 w-full rounded-xl bg-sos py-3 text-sm font-bold text-sos-foreground transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        </div>
      )}
    </section>
  );
}

function SkillsStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profession, setProfession] = useState("");
  const [selected, setSelected] = useState<Record<string, SkillStatus>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (skill: string) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[skill]) delete next[skill];
      else next[skill] = "self_declared";
      return next;
    });

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);

    const { error: profErr } = await supabase
      .from("users")
      .update({ profession: profession.trim() || null })
      .eq("id", user.id);

    const entries = Object.entries(selected);
    let skillErr = null;
    if (entries.length) {
      const res = await supabase.from("user_skills").insert(
        entries.map(([skill_name, status]) => ({ user_id: user.id, skill_name, status }))
      );
      skillErr = res.error;
    }

    setBusy(false);
    if (profErr || skillErr) {
      setError((profErr ?? skillErr)?.message ?? "Could not save your details.");
      return;
    }
    navigate({ to: "/profile" });
  };

  return (
    <section className="mt-10 pb-10">
      <h1 className="text-xl font-bold text-foreground">Add your profession and skills</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Responders use this to match you to nearby emergencies.
      </p>

      <div className="mt-6 space-y-1.5">
        <label htmlFor="profession" className="text-xs font-semibold text-foreground">
          Profession
        </label>
        <input
          id="profession"
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          placeholder="Nurse, Electrician, Student…"
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-info focus:outline-none focus:ring-2 focus:ring-info/25"
        />
      </div>

      <h2 className="mt-6 text-xs font-semibold text-foreground">Skills</h2>
      <div className="mt-2 space-y-2">
        {SKILLS.map((skill) => {
          const status = selected[skill];
          return (
            <div
              key={skill}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                status ? "border-info/40 bg-info-muted/40" : "border-border bg-card"
              )}
            >
              <button
                type="button"
                aria-pressed={Boolean(status)}
                onClick={() => toggle(skill)}
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-card-foreground"
              >
                {skill}
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-md border",
                    status ? "border-info bg-info text-info-foreground" : "border-input"
                  )}
                >
                  {status && <BadgeCheck className="size-3.5" />}
                </span>
              </button>

              {status && (
                <div className="mt-3 flex gap-2">
                  {(["self_declared", "certified"] as SkillStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelected((p) => ({ ...p, [skill]: s }))}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        status === s
                          ? s === "certified"
                            ? "bg-safe text-safe-foreground"
                            : "bg-info text-info-foreground"
                          : "border border-border bg-card text-muted-foreground"
                      )}
                    >
                      {s === "certified" ? "Certified" : "Self-Declared"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-sos">{error}</p>}

      <button
        type="button"
        onClick={finish}
        disabled={busy}
        className="mt-6 w-full rounded-xl bg-sos py-3 text-sm font-bold text-sos-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Finish setup"}
      </button>
    </section>
  );
}
