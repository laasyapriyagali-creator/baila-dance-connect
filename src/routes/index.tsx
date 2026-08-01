import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/baila/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui-baila";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Baila — Dance to connect" },
      { name: "description", content: "Discover people through dance. No bios, no chats — just movement." },
      { property: "og:title", content: "Baila — Dance to connect" },
      { property: "og:description", content: "Discover people through dance. No bios, no chats — just movement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  const cta = hasSession ? "Open Baila" : "Find your rhythm";
  const ctaTo = hasSession ? "/app/dance" : "/auth";

  return (
    <main className="bg-gradient-baila relative flex min-h-[100dvh] flex-col items-center justify-between overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-28 top-16 h-80 w-80 rounded-full bg-white/40 blur-3xl"
        style={{ animation: "baila-rise 1.2s cubic-bezier(0.22,1,0.36,1) both" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-24 h-96 w-96 rounded-full bg-baila-cream/50 blur-3xl"
      />

      <div className="h-2" />

      <div className="animate-rise flex flex-1 flex-col items-center justify-center text-center">
        <div className="animate-pop-in">
          <Logo size={132} className="shadow-float" />
        </div>

        <h1 className="mt-9 font-display text-[4rem] font-semibold leading-none tracking-[-0.05em] text-baila-ink">
          Baila
        </h1>
        <p className="mt-4 text-base font-medium tracking-[-0.01em] text-baila-ink/65">
          Dance to connect
        </p>
        <p className="mt-2 max-w-[19rem] text-sm leading-relaxed text-baila-ink/50">
          No bios. No chats. Just movement, rhythm and real dance floors.
        </p>
      </div>

      <div className="animate-rise w-full max-w-sm" style={{ animationDelay: "120ms" }}>
        <Button variant="ink" size="lg" block onClick={() => navigate({ to: ctaTo })}>
          {cta}
        </Button>
        {!hasSession && (
          <p className="mt-4 text-center text-sm text-baila-ink/55">
            Already here?{" "}
            <Link to="/auth" className="font-semibold text-baila-ink underline underline-offset-4">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
