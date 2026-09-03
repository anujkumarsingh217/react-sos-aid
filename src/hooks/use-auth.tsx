import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensurePendingProfile } from "@/lib/profile";

interface AuthState {
  session: Session | null;
  user: User | null;
  name: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  name: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety net: if an email confirmation link landed on any page (e.g. the
    // project Site URL root) with tokens in the hash, pick them up explicitly.
    const hash = window.location.hash;
    if (hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        void supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          });
      }
    }

    const loadProfile = (userId: string) => {
      // deferred to avoid deadlocking the auth callback
      setTimeout(async () => {
        await ensurePendingProfile(userId);
        const { data } = await supabase.from("users").select("name").eq("id", userId).maybeSingle();
        setName(data?.name ?? null);
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (nextSession?.user) loadProfile(nextSession.user.id);
      else setName(null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) loadProfile(data.session.user.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setName(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, name, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
