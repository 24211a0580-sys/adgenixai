import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function SiteNav() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-5 md:px-10">
      <Link to="/" className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-primary-foreground">
          <span className="font-display text-sm">A</span>
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">Adgenix</span>
      </Link>

      <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
        <a href="/#how" className="transition-colors hover:text-foreground">
          How it works
        </a>
        <a href="/#personas" className="transition-colors hover:text-foreground">
          Personas
        </a>
        <a href="/#channels" className="transition-colors hover:text-foreground">
          Channels
        </a>
        <a href="/#impact" className="transition-colors hover:text-foreground">
          Impact
        </a>
      </nav>

      <div className="flex items-center gap-2">
        {loading ? null : session ? (
          <>
            <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:block">
              {session.user.email}
            </span>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Log out
            </button>
            <Link
              to="/studio"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Studio
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/auth"
              className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Log in
            </Link>
            <Link
              to="/auth"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
