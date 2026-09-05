import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthField } from "@/components/auth-field";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { savePendingProfile } from "@/lib/profile";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Community SOS" },
      { name: "description", content: "Join Community SOS as a volunteer or requester in your community." },
      { property: "og:title", content: "Create account — Community SOS" },
      { property: "og:description", content: "Join Community SOS as a volunteer or requester in your community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const ageRaw = String(form.get("age") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    console.info("[signup] request completed", {
      hasUser: Boolean(data.user),
      hasSession: Boolean(data.session),
      hasError: Boolean(signUpError),
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    savePendingProfile({ name, email, phone, age: ageRaw ? Number(ageRaw) : null });

    let authenticatedSession = data.session;
    if (!authenticatedSession) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setBusy(false);
        return;
      }
      authenticatedSession = signInData.session;
    }

    const currentSession = authenticatedSession ?? (await refreshSession());
    console.info("[signup] redirect decision", {
      destination: currentSession ? "/onboarding" : "stay-on-register",
      hasSession: Boolean(currentSession),
    });
    if (!currentSession) {
      setError("Your account was created, but a session could not be started. Please try again.");
      setBusy(false);
      return;
    }

    await refreshSession();
    navigate({ to: "/onboarding" });
    setBusy(false);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-sos">
          <Activity className="size-6 text-sos-foreground" strokeWidth={2.5} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Join the network</h1>
          <p className="text-xs text-muted-foreground">Help your community when it matters most</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <AuthField id="name" label="Full name" type="text" placeholder="Ananya Roy" />
        <AuthField id="email" label="Email" type="email" placeholder="you@example.com" />
        <AuthField id="phone" label="Phone" type="tel" placeholder="+91 98765 43210" />
        <AuthField id="age" label="Age" type="number" placeholder="28" required={false} />
        <AuthField id="password" label="Password" type="password" placeholder="Min. 6 characters" />

        {error && <p className="text-sm font-medium text-sos">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-sos py-3 text-sm font-bold text-sos-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-info">
          Sign in
        </Link>
      </p>
    </div>
  );
}
