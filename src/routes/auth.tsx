import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/baila/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button, Card, Input } from "@/components/ui-baila";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Baila" },
      { name: "description", content: "Join the Baila dance community and meet partners through movement." },
      { property: "og:title", content: "Sign in — Baila" },
      { property: "og:description", content: "Join the Baila dance community and meet partners through movement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app/dance", replace: true });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Welcome to Baila", { description: "Check your email to confirm, or sign in if confirmation is off." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app/dance", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app/dance", replace: true });
  };

  return (
    <main className="bg-gradient-baila relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-10">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-baila-cream/50 blur-3xl" />

      <Link
        to="/"
        aria-label="Back"
        className="press absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-baila-ink backdrop-blur"
        style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="animate-rise w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo size={68} className="shadow-soft" />
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] text-baila-ink">
            {mode === "signin" ? "Welcome back" : "Find your rhythm"}
          </h1>
          <p className="mt-1.5 text-sm text-baila-ink/60">
            {mode === "signin" ? "Sign in to keep dancing." : "Create an account to start."}
          </p>
        </div>

        <Card className="p-5">
          <Button variant="secondary" size="md" block onClick={handleGoogle} disabled={loading} className="h-12">
            <GoogleMark />
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-baila-ink/35">
            <span className="h-px flex-1 bg-baila-ink/10" />
            or
            <span className="h-px flex-1 bg-baila-ink/10" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="ink" block disabled={loading} className="h-12">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-sm text-baila-ink/65">
          {mode === "signin" ? "New to Baila?" : "Already dancing with us?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-baila-ink underline underline-offset-4"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-2H12z" />
    </svg>
  );
}
