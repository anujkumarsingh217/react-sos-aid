import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthField } from "@/components/auth-field";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Community SOS" },
      { name: "description", content: "Sign in to Community SOS to respond to emergencies near you." },
      { property: "og:title", content: "Sign in — Community SOS" },
      { property: "og:description", content: "Sign in to Community SOS to respond to emergencies near you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-sos">
          <Activity className="size-6 text-sos-foreground" strokeWidth={2.5} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
          <p className="text-xs text-muted-foreground">Sign in to Community SOS</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <AuthField id="email" label="Email" type="email" placeholder="you@example.com" />
        <AuthField id="password" label="Password" type="password" placeholder="••••••••" />

        {error && <p className="text-sm font-medium text-sos">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-info py-3 text-sm font-bold text-info-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/register" className="font-semibold text-info">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link to="/" className="text-muted-foreground">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
