import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Heart, RotateCcw, CalendarClock } from "lucide-react";
import { useSettings } from "@/lib/use-settings";
import { Card, Page, Skeleton, Toggle } from "@/components/ui-baila";

export const Route = createFileRoute("/_authenticated/app/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notification preferences — Baila" },
      { name: "description", content: "Control which Baila notifications you receive." },
      { property: "og:title", content: "Notification preferences — Baila" },
      { property: "og:description", content: "Control which Baila notifications you receive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationSettingsPage,
});

function NotificationSettingsPage() {
  const { settings, isLoading, update } = useSettings();
  const master = settings?.notif_master ?? true;

  return (
    <Page className="pb-10">
      <Header title="Notifications" />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <SwitchRow
              Icon={Bell}
              label="Notifications"
              sub="Master switch for everything below"
              checked={master}
              onChange={(v) => update({ notif_master: v })}
              last
            />
          </Card>

          <Card className="overflow-hidden">
            <SwitchRow
              Icon={Heart}
              label="Dance requests"
              sub="When someone wants to dance with you"
              checked={settings?.notif_requests ?? true}
              onChange={(v) => update({ notif_requests: v })}
              disabled={!master}
            />
            <SwitchRow
              Icon={CalendarClock}
              label="Accepted / declined"
              sub="Updates on requests you sent"
              checked={settings?.notif_decisions ?? true}
              onChange={(v) => update({ notif_decisions: v })}
              disabled={!master}
            />
            <SwitchRow
              Icon={RotateCcw}
              label="Dance again"
              sub="When someone wants to dance again"
              checked={settings?.notif_again ?? true}
              onChange={(v) => update({ notif_again: v })}
              disabled={!master}
            />
            <SwitchRow
              Icon={CalendarClock}
              label="Date reminders"
              sub="Ahead of an upcoming dance date"
              checked={settings?.notif_reminders ?? true}
              onChange={(v) => update({ notif_reminders: v })}
              disabled={!master}
              last
            />
          </Card>
        </div>
      )}
    </Page>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link
        to="/app/settings"
        aria-label="Back"
        className="press flex h-11 w-11 items-center justify-center rounded-full border border-baila-ink/10 bg-white text-baila-ink shadow-soft"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="font-display text-[2rem] font-semibold tracking-[-0.03em] text-baila-ink">{title}</h1>
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
  disabled,
}: {
  Icon: typeof Bell;
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 px-4 py-4 transition-opacity ${
        last ? "" : "border-b border-baila-ink/[0.06]"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-baila-yellow-soft text-baila-ink">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-baila-ink">{label}</p>
        {sub && <p className="truncate text-xs text-baila-ink/50">{sub}</p>}
      </div>
      <Toggle checked={checked} onCheckedChange={onChange} label={label} className={disabled ? "pointer-events-none" : ""} />
    </div>
  );
}
