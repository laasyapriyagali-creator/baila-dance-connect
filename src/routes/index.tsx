import { createFileRoute, redirect } from "@tanstack/react-router";
import { DanceLoader } from "@/components/ui-baila";

export const Route = createFileRoute("/")({
  ssr: false,
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
  // Baila opens straight into the dance floor — the guest session is started by
  // the /_authenticated layout, so there is no sign-in wall on entry.
  beforeLoad: () => {
    throw redirect({ to: "/app/dance" });
  },
  component: () => (
    <main className="bg-gradient-baila flex min-h-[100dvh] items-center justify-center">
      <DanceLoader label="Warming up the floor…" />
    </main>
  ),
});
