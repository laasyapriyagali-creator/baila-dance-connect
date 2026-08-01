import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useState } from "react";
import { Group, SettingsShell, TextRow } from "@/components/baila/settings-ui";
import { DANCE_STYLES, EXPERIENCES, bailaStore, type Experience } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";

export const Route = createFileRoute("/settings/account")({
  head: () => ({
    meta: [
      { title: "Profile details — Baila settings" },
      {
        name: "description",
        content: "Edit the name, age, city, bio, dance styles and experience level shown on your Baila profile.",
      },
      { property: "og:title", content: "Profile details — Baila settings" },
      { property: "og:description", content: "Edit your Baila profile details." },
    ],
  }),
  component: AccountSettings,
});

function AccountSettings() {
  const { profile } = useBaila();
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age ? String(profile.age) : "");
  const [city, setCity] = useState(profile.city);
  const [bio, setBio] = useState(profile.bio);
  const [experience, setExperience] = useState<Experience>(profile.experience);
  const [styles, setStyles] = useState<string[]>(profile.styles);

  return (
    <SettingsShell
      title="Profile details"
      backTo="/settings"
      intro="This is what other dancers see next to your reels."
    >
      <Group>
        <TextRow label="Name" value={name} onChange={setName} placeholder="Your name" />
        <TextRow
          label="Age"
          type="number"
          value={age}
          onChange={setAge}
          placeholder="18+"
          hint="Baila is for adults only."
        />
        <TextRow label="City" value={city} onChange={setCity} placeholder="Where do you dance?" />
        <label className="block px-4 py-3">
          <span className="block text-sm font-semibold text-baila-ink">Bio</span>
          <textarea
            value={bio}
            rows={3}
            onChange={(e) => setBio(e.target.value)}
            className="mt-2 w-full rounded-2xl bg-baila-ink/5 px-4 py-2.5 text-sm text-baila-ink outline-none"
          />
        </label>
      </Group>

      <Group label="Experience">
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {EXPERIENCES.map((e) => (
            <button
              key={e}
              onClick={() => setExperience(e)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                experience === e ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/70"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </Group>

      <Group label="My styles">
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {DANCE_STYLES.map((s) => (
            <button
              key={s}
              onClick={() =>
                setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
              }
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                styles.includes(s) ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Group>

      <button
        onClick={() => {
          const parsed = Number(age);
          if (age && (!Number.isFinite(parsed) || parsed < 18 || parsed > 120)) {
            toast.error("Enter an age of 18 or older");
            return;
          }
          bailaStore.saveProfile({
            name: name.trim(),
            age: age ? parsed : null,
            city: city.trim(),
            bio: bio.trim(),
            experience,
            styles,
          });
          toast.success("Profile saved");
        }}
        className="mb-8 flex w-full items-center justify-center gap-2 rounded-full bg-baila-ink py-3.5 text-sm font-semibold text-baila-cream"
      >
        <Check className="h-4 w-4" /> Save changes
      </button>
    </SettingsShell>
  );
}
