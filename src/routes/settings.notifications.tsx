import { createFileRoute } from "@tanstack/react-router";
import { Group, SettingsShell, ToggleRow } from "@/components/baila/settings-ui";
import { bailaStore } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";

export const Route = createFileRoute("/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Baila settings" },
      {
        name: "description",
        content:
          "Choose which Baila alerts you get: dance invites, replies, date reminders and go-again requests.",
      },
      { property: "og:title", content: "Notifications — Baila settings" },
      { property: "og:description", content: "Pick the Baila alerts you actually want." },
    ],
  }),
  component: NotificationSettings,
});

function NotificationSettings() {
  const { settings } = useBaila();
  const n = settings.notifications;
  const muted = n.muteAll;

  return (
    <SettingsShell
      title="Notifications"
      backTo="/settings"
      intro="No likes, no follows, no streaks — only things that lead to a real dance."
    >
      <Group>
        <ToggleRow
          label="Mute everything"
          checked={muted}
          onChange={(v) => bailaStore.patchSection("notifications", { muteAll: v })}
        />
      </Group>

      <Group label="Dances">
        <ToggleRow
          label="New dance invites"
          hint="Someone asked you to dance."
          checked={n.invites}
          disabled={muted}
          onChange={(v) => bailaStore.patchSection("notifications", { invites: v })}
        />
        <ToggleRow
          label="Invite accepted or declined"
          checked={n.responses}
          disabled={muted}
          onChange={(v) => bailaStore.patchSection("notifications", { responses: v })}
        />
        <ToggleRow
          label='"Go again?" requests'
          hint="After a completed date."
          checked={n.goAgain}
          disabled={muted}
          onChange={(v) => bailaStore.patchSection("notifications", { goAgain: v })}
        />
      </Group>

      <Group label="Dates">
        <ToggleRow
          label="Date reminders"
          hint="A day before and two hours before."
          checked={n.reminders}
          disabled={muted}
          onChange={(v) => bailaStore.patchSection("notifications", { reminders: v })}
        />
      </Group>
    </SettingsShell>
  );
}
