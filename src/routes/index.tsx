import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/baila/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Baila — Dance to connect" },
      { name: "description", content: "Discover people through dance. No bios, no chats — just movement." },
      { property: "og:title", content: "Baila — Dance to connect" },
      { property: "og:description", content: "Discover people through dance. No bios, no chats — just movement." },
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
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-between overflow-hidden px-6 py-12"
      style={{ backgroundColor: "var(--baila-yellow)" }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: "var(--baila-yellow-soft)" }}
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: "var(--baila-cream)" }}
        animate={{ y: [0, -24, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="h-2" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-1 flex-col items-center justify-center text-center"
      >
        <motion.div
          animate={{ rotate: [0, -3, 3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Logo size={132} className="shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]" />
        </motion.div>

        <h1 className="mt-8 font-display text-6xl font-semibold tracking-tight text-baila-ink">
          Baila
        </h1>
        <p className="mt-3 text-base font-medium text-baila-ink/70">Dance to connect</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={() => navigate({ to: ctaTo })}
          className="block w-full rounded-full bg-baila-ink px-8 py-5 text-center text-lg font-semibold text-baila-cream transition active:scale-[0.98]"
        >
          {cta}
        </button>
        {!hasSession && (
          <p className="mt-4 text-center text-sm text-baila-ink/60">
            Already here?{" "}
            <Link to="/auth" className="font-semibold underline underline-offset-2">
              Sign in
            </Link>
          </p>
        )}
      </motion.div>
    </main>
  );
}
