import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Bell,
  Compass,
  Download,
  FileText,
  Info,
  LifeBuoy,
  Lock,
  Pause,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Group, RowButton, RowLink, SettingsShell, ToggleRow } from "@/components/baila/settings-ui";
import { bailaStore } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Baila" },
      {
        name: "description",
        content:
          "Manage your Baila account, discovery filters, privacy, safety tools, notifications and community guidelines.",
      },
      { property: "og:title", content: "Settings — Baila" },
      {
        property: "og:description",
        content: "Account, discovery, privacy, safety and legal settings for Baila.",
      },
    ],
  }),
  component: SettingsIndex,
});

function SettingsIndex() {
  const { settings, profile } = useBaila();

  return (
    <SettingsShell title="Settings" backTo="/">
      <Group label="Account">
        <RowLink
          to="/settings/account"
          label="Profile details"
          hint={profile.name ? `${profile.name}${profile.city ? ` · ${profile.city}` : ""}` : "Add your name, age and city"}
          icon={<UserRound className="h-4 w-4" />}
        />
        <ToggleRow
          label="Pause my profile"
          hint="Hide my reels from the Dance feed. My dates stay."
          checked={settings.paused}
          onChange={(v) => {
            bailaStore.patchSettings({ paused: v });
            toast.success(v ? "Profile paused" : "Profile live again");
          }}
        />
      </Group>

      <Group label="Experience">
        <RowLink
          to="/settings/discovery"
          label="Discovery"
          hint="Styles, distance, age range, who can see me"
          icon={<Compass className="h-4 w-4" />}
        />
        <RowLink
          to="/settings/privacy"
          label="Privacy"
          hint="Age, location, who sees your reels, your data"
          icon={<Lock className="h-4 w-4" />}
        />
        <RowLink
          to="/settings/safety"
          label="Safety"
          hint="Blocked dancers, reporting, date safety"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <RowLink
          to="/settings/notifications"
          label="Notifications"
          hint="Invites, replies, date reminders"
          icon={<Bell className="h-4 w-4" />}
        />
      </Group>

      <Group label="Community & legal">
        <RowLink
          to="/legal/guidelines"
          label="Community guidelines"
          hint="How we dance together"
          icon={<FileText className="h-4 w-4" />}
        />
        <RowLink to="/legal/safety" label="Dating safety tips" icon={<LifeBuoy className="h-4 w-4" />} />
        <RowLink to="/legal/terms" label="Terms of service" icon={<FileText className="h-4 w-4" />} />
        <RowLink to="/legal/privacy" label="Privacy policy" icon={<FileText className="h-4 w-4" />} />
      </Group>

      <Group label="Your data">
        <RowButton
          label="Download my data"
          hint="Profile, reel details and dates as a JSON file"
          icon={<Download className="h-4 w-4" />}
          onClick={() => {
            const blob = new Blob([bailaStore.exportData()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "baila-my-data.json";
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Data exported");
          }}
        />
        <RowButton
          label="Delete everything"
          hint="Removes your profile, reels and dates from this device. Cannot be undone."
          icon={<Trash2 className="h-4 w-4" />}
          danger
          onClick={() => {
            if (!window.confirm("Delete your profile, all reels and all dates? This cannot be undone.")) {
              return;
            }
            void bailaStore.eraseEverything().then(() => toast.success("Everything deleted"));
          }}
        />
      </Group>

      <div className="mb-6 flex items-start gap-2 rounded-3xl bg-baila-ink/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-baila-ink/50" />
        <p className="text-xs text-baila-ink/65">
          Baila currently runs entirely on this device — there is no account and nothing is uploaded.
          Blocking, reporting and pausing apply to this device only until accounts arrive.
        </p>
      </div>

      <p className="pb-8 text-center text-[11px] text-baila-ink/40">
        <Pause className="mr-1 inline h-3 w-3" />
        Baila MVP · local build
      </p>
    </SettingsShell>
  );
}
