import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Group, SegmentRow, SettingsShell, SliderRow } from "@/components/baila/settings-ui";
import { DANCE_STYLES, bailaStore } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";

export const Route = createFileRoute("/settings/discovery")({
  head: () => ({
    meta: [
      { title: "Discovery — Baila settings" },
      {
        name: "description",
        content:
          "Choose the dance styles, distance and age range you see in the Baila feed, and control who you appear to.",
      },
      { property: "og:title", content: "Discovery — Baila settings" },
      { property: "og:description", content: "Tune the styles, distance and age range of your Baila feed." },
    ],
  }),
  component: DiscoverySettings,
});

function DiscoverySettings() {
  const { settings } = useBaila();
  const d = settings.discovery;

  return (
    <SettingsShell
      title="Discovery"
      backTo="/settings"
      intro="Shapes the Dance feed. Movement first — no ranking, no popularity."
    >
      <Group label="Styles I want to see">
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {DANCE_STYLES.map((s) => (
            <button
              key={s}
              onClick={() =>
                bailaStore.patchSection("discovery", {
                  styles: d.styles.includes(s) ? d.styles.filter((x) => x !== s) : [...d.styles, s],
                })
              }
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                d.styles.includes(s) ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => bailaStore.patchSection("discovery", { styles: [] })}
          className="w-full px-4 py-3 text-left text-sm font-semibold text-baila-ink/60"
        >
          Show every style
        </button>
      </Group>

      <Group label="Range">
        <SliderRow
          label="Distance"
          value={d.radiusKm}
          min={1}
          max={200}
          suffix=" km"
          onChange={(v) => bailaStore.patchSection("discovery", { radiusKm: v })}
        />
        <SliderRow
          label="Minimum age"
          value={d.ageMin}
          min={18}
          max={d.ageMax}
          onChange={(v) => bailaStore.patchSection("discovery", { ageMin: v })}
        />
        <SliderRow
          label="Maximum age"
          value={d.ageMax}
          min={d.ageMin}
          max={80}
          onChange={(v) => bailaStore.patchSection("discovery", { ageMax: v })}
        />
      </Group>

      <Group label="Visibility">
        <SegmentRow
          label="Show me to"
          hint="Who can find your reels in the feed."
          value={d.visibleTo}
          options={[
            { value: "everyone", label: "Everyone" },
            { value: "invited", label: "Only dancers I asked" },
          ]}
          onChange={(v) => bailaStore.patchSection("discovery", { visibleTo: v })}
        />
      </Group>

      <button
        onClick={() => {
          bailaStore.resetPassed();
          toast.success("Passed dancers are back in the feed");
        }}
        className="mb-8 w-full rounded-full bg-baila-ink/10 py-3.5 text-sm font-semibold text-baila-ink"
      >
        Reset dancers I passed
      </button>
    </SettingsShell>
  );
}
