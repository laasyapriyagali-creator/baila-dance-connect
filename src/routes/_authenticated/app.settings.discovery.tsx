import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth";
import { useSettings } from "@/lib/use-settings";
import { resetSkips } from "@/lib/baila-data";
import { DANCE_STYLES } from "@/lib/baila-types";
import { Button, Card, Chip, Field, Input, Page, Skeleton, Toggle } from "@/components/ui-baila";

export const Route = createFileRoute("/_authenticated/app/settings/discovery")({
  head: () => ({
    meta: [
      { title: "Discovery preferences — Baila" },
      { name: "description", content: "Choose the styles, distance and age range you want to see in your feed." },
      { property: "og:title", content: "Discovery preferences — Baila" },
      { property: "og:description", content: "Choose the styles, distance and age range you want to see in your feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoverySettingsPage,
});

function DiscoverySettingsPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { settings, isLoading, update } = useSettings();

  const [styles, setStyles] = useState<string[]>([]);
  const [distance, setDistance] = useState(50);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(60);

  useEffect(() => {
    if (!settings) return;
    setStyles(settings.discovery_styles ?? []);
    setDistance(settings.max_distance_km ?? 50);
    setAgeMin(settings.age_min ?? 18);
    setAgeMax(settings.age_max ?? 60);
  }, [settings]);

  const toggleStyle = (style: string) => {
    const next = styles.includes(style) ? styles.filter((s) => s !== style) : [...styles, style];
    setStyles(next);
    update({ discovery_styles: next });
  };

  const showAll = () => {
    setStyles([]);
    update({ discovery_styles: [] });
  };

  const commitAgeMin = (v: number) => {
    const min = Math.max(18, Math.min(99, v));
    const max = Math.max(min, ageMax);
    setAgeMin(min);
    setAgeMax(max);
    update({ age_min: min, age_max: max });
  };

  const commitAgeMax = (v: number) => {
    const max = Math.max(18, Math.min(99, v));
    const min = Math.min(ageMin, max);
    setAgeMax(max);
    setAgeMin(min);
    update({ age_min: min, age_max: max });
  };

  const commitDistance = (v: number) => {
    setDistance(v);
    update({ max_distance_km: v });
  };

  const resetFeed = async () => {
    if (!user) return;
    try {
      await resetSkips(user.id);
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Feed reset — skipped dancers can appear again.");
    } catch {
      toast.error("Couldn't reset your feed. Try again.");
    }
  };

  return (
    <Page className="pb-10">
      <Header title="Discovery" />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <Field label="Dance styles" hint="Leave empty to see every style">
            <Card className="flex flex-wrap gap-2 p-4">
              <Chip active={styles.length === 0} onClick={showAll}>
                Show every style
              </Chip>
              {DANCE_STYLES.map((style) => (
                <Chip key={style} active={styles.includes(style)} onClick={() => toggleStyle(style)}>
                  {style}
                </Chip>
              ))}
            </Card>
          </Field>

          <Field label="Max distance" hint={`${distance} km`}>
            <Card className="p-4">
              <input
                type="range"
                min={1}
                max={200}
                value={distance}
                onChange={(e) => commitDistance(Number(e.target.value))}
                className="w-full accent-baila-ink"
              />
            </Card>
          </Field>

          <Field label="Age range">
            <Card className="flex items-center gap-3 p-4">
              <Input
                type="number"
                min={18}
                max={99}
                value={ageMin}
                onChange={(e) => commitAgeMin(Number(e.target.value) || 18)}
                className="w-24"
              />
              <span className="text-sm text-baila-ink/50">to</span>
              <Input
                type="number"
                min={18}
                max={99}
                value={ageMax}
                onChange={(e) => commitAgeMax(Number(e.target.value) || 99)}
                className="w-24"
              />
            </Card>
          </Field>

          <Field label="Visibility">
            <Card className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-[15px] font-semibold text-baila-ink">Appear in discovery</p>
                <p className="text-xs text-baila-ink/50">Turn off to hide from other dancers' feeds</p>
              </div>
              <Toggle
                checked={settings?.discoverable ?? true}
                onCheckedChange={(v) => update({ discoverable: v })}
                label="Discoverable"
              />
            </Card>
          </Field>

          <Button variant="secondary" block onClick={resetFeed}>
            <RotateCcw className="h-4 w-4" /> Reset feed
          </Button>
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
