import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Adgenix" },
      {
        name: "description",
        content: "Log in or create an Adgenix account to generate brand-aware marketing campaigns.",
      },
      { property: "og:title", content: "Sign in to Adgenix" },
      { property: "og:description", content: "Access the Adgenix Campaign Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/studio" });
  }, [session, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/studio` },
        });
        if (error) throw error;
        setMsg("Account created. If email confirmation is on, check your inbox.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/studio" });
      }
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErr(result.error.message ?? "Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/studio" });
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="shell w-full max-w-md p-8">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Adgenix
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to open the Campaign Studio.
        </p>

        <button
          type="button"
          onClick={google}
          className="mt-6 w-full rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            className={inputCls}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={inputCls}
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        {err ? <p className="mt-3 text-sm text-destructive">{err}</p> : null}
        {msg ? <p className="mt-3 text-sm text-muted-foreground">{msg}</p> : null}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setErr(null);
            setMsg(null);
          }}
          className="mt-5 w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
