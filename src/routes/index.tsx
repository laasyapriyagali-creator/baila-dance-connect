import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/baila/Logo";

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
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-between overflow-hidden px-6 py-12"
      style={{ backgroundColor: "var(--baila-yellow)" }}
    >
      {/* subtle motion blobs */}
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
        <p className="mt-3 text-base font-medium text-baila-ink/70">
          Dance to connect
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <Link
          to="/app/dance"
          className="block w-full rounded-full bg-baila-ink px-8 py-5 text-center text-lg font-semibold text-baila-cream transition active:scale-[0.98]"
        >
          Find Your Rhythm
        </Link>
        <p className="mt-4 text-center text-sm text-baila-ink/60">
          Discover people through dance.
        </p>
      </motion.div>
    </main>
  );
}
