import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import type { FormEvent } from "react";
import { AuthField } from "@/components/auth-field";

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
  const onSubmit = (e: FormEvent) => e.preventDefault(); // placeholder until auth is wired

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
        <AuthField id="password" label="Password" type="password" placeholder="Min. 8 characters" />
        <button
          type="submit"
          className="w-full rounded-xl bg-sos py-3 text-sm font-bold text-sos-foreground transition-opacity hover:opacity-90"
        >
          Create account
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
