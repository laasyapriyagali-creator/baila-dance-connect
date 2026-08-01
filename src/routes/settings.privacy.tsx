import { createFileRoute } from "@tanstack/react-router";
import { Group, SegmentRow, SettingsShell, ToggleRow } from "@/components/baila/settings-ui";
import { bailaStore } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";

export const Route = createFileRoute("/settings/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Baila settings" },
      {
        name: "description",
        content:
          "Control what your Baila profile reveals: hide your age, show your city only, and choose who can watch your dance reels.",
      },
      { property: "og:title", content: "Privacy — Baila settings" },
      { property: "og:description", content: "Decide what your Baila profile reveals and who can see your reels." },
    ],
  }),
  component: PrivacySettings,
});

function PrivacySettings() {
  const { settings } = useBaila();
  const p = settings.privacy;

  return (
    <SettingsShell
      title="Privacy"
      backTo="/settings"
      intro="You decide how much of you is visible before a dance date."
    >
      <Group label="On my profile">
        <ToggleRow
          label="Hide my age"
          hint="Your age still filters discovery, it just isn't shown."
          checked={p.hideAge}
          onChange={(v) => bailaStore.patchSection("privacy", { hideAge: v })}
        />
        <ToggleRow
          label="Show city only"
          hint="Never share a precise location — only the city you dance in."
          checked={p.cityOnly}
          onChange={(v) => bailaStore.patchSection("privacy", { cityOnly: v })}
        />
      </Group>

      <Group label="My reels">
        <SegmentRow
          label="Who can watch my reels"
          value={p.reelsVisibleTo}
          options={[
            { value: "everyone", label: "Everyone in the feed" },
            { value: "matches", label: "Only my dates" },
          ]}
          onChange={(v) => bailaStore.patchSection("privacy", { reelsVisibleTo: v })}
        />
        <ToggleRow
          label="Featured dancer"
          hint="Allow my reels to be highlighted to nearby dancers."
          checked={p.featured}
          onChange={(v) => bailaStore.patchSection("privacy", { featured: v })}
        />
      </Group>

      <Group label="Data">
        <ToggleRow
          label="Usage analytics"
          hint="Off by default. Nothing leaves this device while Baila is local-only."
          checked={p.analytics}
          onChange={(v) => bailaStore.patchSection("privacy", { analytics: v })}
        />
      </Group>

      <p className="mb-8 px-1 text-xs text-baila-ink/55">
        Download or delete all of your data from Settings → Your data. Full details are in the{" "}
        privacy policy.
      </p>
    </SettingsShell>
  );
}
