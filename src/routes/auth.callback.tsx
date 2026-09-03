import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Confirming your account — Community SOS" }],
  }),
  component: AuthCallbackPage,
});

/**
 * Landing page for email confirmation / magic links. Supabase appends the
 * session tokens to the URL hash (#access_token=...&type=signup). We parse
 * them explicitly (works even if auto-detection missed them) and then send
 * the user home with a live session.
 */
function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finish = async () => {
      // Already signed in (supabase-js may have auto-detected the hash) —
      // just strip the hash and go home.
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        window.history.replaceState(null, "", window.location.pathname);
        navigate({ to: "/" });
        return;
      }

      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        navigate({ to: "/" });
        return;
      }

      // Token-exchange links (?code=...) for PKCE-style flows.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        navigate({ to: "/" });
        return;
      }

      setError("This confirmation link is invalid or has expired. Try signing in instead.");
    };

    void finish();
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-sos">
        <Activity className="size-7 text-sos-foreground" strokeWidth={2.5} />
      </span>
      {error ? (
        <>
          <h1 className="mt-4 text-lg font-bold text-foreground">Couldn't confirm your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="mt-6 rounded-xl bg-info px-5 py-2.5 text-sm font-bold text-info-foreground"
          >
            Go to sign in
          </button>
        </>
      ) : (
        <>
          <h1 className="mt-4 text-lg font-bold text-foreground">Confirming your account…</h1>
          <p className="mt-2 text-sm text-muted-foreground">You'll be signed in automatically.</p>
        </>
      )}
    </div>
  );
}
