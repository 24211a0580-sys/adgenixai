import { Link } from "@tanstack/react-router";

export function SiteNav() {
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
        <Link
          to="/studio"
          className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-sm transition-transform hover:-translate-y-0.5"
        >
          Log in
        </Link>
        <Link
          to="/studio"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Open Studio
        </Link>
      </div>
    </header>
  );
}
