import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Activity, Home, Hospital, LogOut, ShieldCheck, User } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/hospital-dashboard", label: "Hospital", icon: Hospital },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const bareRoutes = ["/login", "/register"];

/** Mobile-first shell: centered column, top bar, bottom tab navigation. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = bareRoutes.includes(pathname);
  const { user, name, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-border bg-background">
      {!bare && (
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sos">
            <Activity className="size-5 text-sos-foreground" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-foreground">Community SOS</p>
            <p className="text-[11px] text-muted-foreground">
              {user ? `Signed in as ${name ?? user.email}` : "Emergency coordination network"}
            </p>
          </div>
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="ml-auto flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-sos"
            >
              <LogOut className="size-3.5" />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-auto rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-info"
            >
              Sign in
            </Link>
          )}
        </header>
      )}


      {!bare && <VolunteerAlerts />}

      <main className={cn("flex-1", !bare && "pb-20")}>{children}</main>

      {!bare && (
        <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur">
          <div className="grid grid-cols-4">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-info"
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
