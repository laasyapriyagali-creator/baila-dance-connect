import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Music2, Heart, User } from "lucide-react";
import { DanceFeed } from "@/components/baila/DanceFeed";
import { DatesPanel } from "@/components/baila/DatesPanel";
import { ProfilePanel } from "@/components/baila/ProfilePanel";
import { UploadReelDialog } from "@/components/baila/UploadReelDialog";
import { useBaila } from "@/lib/use-baila";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Baila — Dance to connect" },
      {
        name: "description",
        content:
          "Baila is a dance-first way to meet people: share reels, ask someone to dance, and plan a real-life dance date. No bios, no chatting.",
      },
      { property: "og:title", content: "Baila — Dance to connect" },
      {
        property: "og:description",
        content: "Share dance reels, ask someone to dance, plan a real-life dance date.",
      },
    ],
  }),
  component: BailaApp,
});

type Tab = "dance" | "date" | "profile";

function BailaApp() {
  const [tab, setTab] = useState<Tab>("dance");
  const [uploadOpen, setUploadOpen] = useState(false);
  const { profile, dates } = useBaila();
  const pendingDates = dates.filter((d) => d.status === "invited").length;

  return (
    <main className="relative mx-auto min-h-[100dvh] max-w-md bg-baila-cream">
      {tab === "dance" && <DanceFeed onAddReel={() => setUploadOpen(true)} />}
      {tab === "date" && <DatesPanel />}
      {tab === "profile" && <ProfilePanel onAddReel={() => setUploadOpen(true)} />}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-baila-ink/10 bg-baila-cream/95 backdrop-blur"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        <ul className="grid grid-cols-3">
          {(
            [
              { key: "dance", label: "Dance", Icon: Music2, badge: 0 },
              { key: "date", label: "Date", Icon: Heart, badge: pendingDates },
              { key: "profile", label: "Profile", Icon: User, badge: 0 },
            ] as const
          ).map(({ key, label, Icon, badge }) => (
            <li key={key}>
              <button
                onClick={() => setTab(key)}
                data-active={tab === key ? "true" : undefined}
                className="group flex min-h-11 w-full flex-col items-center gap-0.5 py-2.5 text-baila-ink/50 data-[active=true]:text-baila-ink"
              >
                <span className="relative flex h-9 w-12 items-center justify-center rounded-full transition group-data-[active=true]:bg-baila-yellow">
                  <Icon className="h-[19px] w-[19px]" strokeWidth={2.25} />
                  {badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-baila-ink px-1 text-[10px] font-bold text-baila-cream">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-semibold tracking-wide">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <UploadReelDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultDancer={profile.name}
      />
    </main>
  );
}
