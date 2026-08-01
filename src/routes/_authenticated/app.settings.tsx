import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, LogOut, Shield, Bell, HardDrive, Music2, LifeBuoy, UserCog, PlayCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, Page, Toggle } from "@/components/ui-baila";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Baila" },
      { name: "description", content: "Manage your Baila account, privacy, notifications and playback preferences." },
      { property: "og:title", content: "Settings — Baila" },
      { property: "og:description", content: "Manage your Baila account, privacy, notifications and playback preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const SECTIONS: { title: string; items: { Icon: typeof Bell; label: string; sub?: string }[] }[] = [
  {
    title: "My account",
    items: [
      { Icon: UserCog, label: "Account information", sub: "Email and login" },
    ],
  },
  {
    title: "Privacy & safety",
    items: [
      { Icon: Shield, label: "Profile visibility", sub: "Who can find you" },
      { Icon: Shield, label: "Blocked dancers" },
    ],
  },
  {
    title: "Dance preferences",
    items: [{ Icon: Music2, label: "Preferred styles", sub: "Edit in your profile" }],
  },
  {
    title: "Storage & data",
    items: [{ Icon: HardDrive, label: "Video quality", sub: "Auto (recommended)" }],
  },
  {
    title: "Support",
    items: [
      { Icon: LifeBuoy, label: "Help center" },
      { Icon: LifeBuoy, label: "Terms of service" },
      { Icon: LifeBuoy, label: "Privacy policy" },
    ],
  },
];

function SettingsPage() {
  const navigate = useNavigate();
  const [pushOn, setPushOn] = useState(true);
  const [autoplayOn, setAutoplayOn] = useState(true);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };

  return (
    <Page className="pb-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/app/profile"
          aria-label="Back"
          className="press flex h-11 w-11 items-center justify-center rounded-full border border-baila-ink/10 bg-white text-baila-ink shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <h1 className="font-display text-[2rem] font-semibold tracking-[-0.03em] text-baila-ink">Settings</h1>
      </div>

      <div className="space-y-6">
        <Group title="Notifications">
          <SwitchRow
            Icon={Bell}
            label="Push notifications"
            sub="Dance requests and matches"
            checked={pushOn}
            onChange={setPushOn}
          />
          <SwitchRow
            Icon={PlayCircle}
            label="Autoplay videos"
            sub="Play dances as you scroll"
            checked={autoplayOn}
            onChange={setAutoplayOn}
            last
          />
        </Group>

        {SECTIONS.map((section) => (
          <Group key={section.title} title={section.title}>
            {section.items.map(({ Icon, label, sub }, i) => (
              <Row key={label} Icon={Icon} label={label} sub={sub} last={i === section.items.length - 1} />
            ))}
          </Group>
        ))}

        <Group title="Account">
          <button onClick={logout} className="press flex w-full items-center gap-3.5 px-4 py-4 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-semibold text-destructive">Log out</span>
          </button>
        </Group>

        <p className="pt-2 text-center text-[11px] text-baila-ink/35">Baila · meet through movement</p>
      </div>
    </Page>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-baila-ink/40">{title}</p>
      <Card className="overflow-hidden">{children}</Card>
    </section>
  );
}

function Row({
  Icon,
  label,
  sub,
  last,
}: {
  Icon: typeof Bell;
  label: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-baila-yellow-soft/40 ${
        last ? "" : "border-b border-baila-ink/[0.06]"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-baila-yellow-soft text-baila-ink">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-baila-ink">{label}</p>
        {sub && <p className="truncate text-xs text-baila-ink/50">{sub}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-baila-ink/30" />
    </div>
  );
}

function SwitchRow({
  Icon,
  label,
  sub,
  checked,
  onChange,
  last,
}: {
  Icon: typeof Bell;
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 px-4 py-4 ${last ? "" : "border-b border-baila-ink/[0.06]"}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-baila-yellow-soft text-baila-ink">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-baila-ink">{label}</p>
        {sub && <p className="truncate text-xs text-baila-ink/50">{sub}</p>}
      </div>
      <Toggle checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}
