import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AVAILABILITY,
  DANCE_STYLES,
  LANGUAGES,
  ROLE_LABEL,
  type AppRole,
  type Experience,
  type Profile,
  type Social,
} from "@/lib/baila-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EXPERIENCES: Experience[] = ["Beginner", "Intermediate", "Advanced", "Pro"];
const ROLES: AppRole[] = ["dancer", "instructor", "organizer"];

export function EditProfileDialog({
  profile,
  open,
  onOpenChange,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => initial(profile));
  const [saving, setSaving] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setForm(initial(profile));
  }, [open, profile]);

  const toggle = <K extends "dance_styles" | "availability" | "languages">(key: K, s: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(s) ? f[key].filter((x) => x !== s) : [...f[key], s],
    }));

  const updateSocial = (i: number, patch: Partial<Social>) =>
    setForm((f) => ({ ...f, socials: f.socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const addSocial = () => setForm((f) => ({ ...f, socials: [...f.socials, { label: "", url: "" }] }));
  const removeSocial = (i: number) =>
    setForm((f) => ({ ...f, socials: f.socials.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.display_name.trim()) return toast.error("Add a display name");
    setAgeError(null);
    if (form.age.trim()) {
      const ageNum = Number(form.age);
      if (!Number.isInteger(ageNum) || ageNum < 18 || ageNum > 99) {
        setAgeError("Age must be a whole number between 18 and 99");
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim(),
        username: form.username.trim() || null,
        bio: form.bio.trim() || null,
        headline: form.headline.trim() || null,
        city: form.city.trim() || null,
        experience: form.experience,
        years_dancing: form.years_dancing ? Number(form.years_dancing) : null,
        age: form.age.trim() ? Number(form.age) : null,
        languages: form.languages,
        favorite_style: form.favorite_style || null,
        role: form.role,
        availability: form.availability,
        dance_styles: form.dance_styles,
        socials: form.socials.filter((s) => s.label.trim() && s.url.trim()),
        onboarded: true,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile", profile.id] });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit profile</DialogTitle>
          <DialogDescription>Tell people how you move.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="I'm a">
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Chip key={r} on={form.role === r} onClick={() => setForm({ ...form, role: r })}>
                  {ROLE_LABEL[r]}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Display name">
            <Input value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} placeholder="Your name" />
          </Field>
          <Field label="Username">
            <Input
              value={form.username}
              onChange={(v) => setForm({ ...form, username: v.replace(/[^a-z0-9._]/gi, "").toLowerCase() })}
              placeholder="username"
            />
          </Field>
          <Field label="Headline">
            <Input value={form.headline} onChange={(v) => setForm({ ...form, headline: v.slice(0, 80) })} placeholder="One line about your dance" />
          </Field>
          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={200}
              rows={3}
              placeholder="A short note about how you dance."
              className="w-full resize-none rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px] focus-visible:border-baila-ink focus-visible:outline-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <Input value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Where you dance" />
            </Field>
            <Field label="Years dancing">
              <Input
                value={form.years_dancing}
                onChange={(v) => setForm({ ...form, years_dancing: v.replace(/[^0-9]/g, "").slice(0, 2) })}
                placeholder="e.g. 4"
              />
            </Field>
          </div>
          <Field label="Experience">
            <div className="flex flex-wrap gap-2">
              {EXPERIENCES.map((e) => (
                <Chip key={e} on={form.experience === e} onClick={() => setForm({ ...form, experience: e })}>
                  {e}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Availability">
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY.map((a) => (
                <Chip key={a} on={form.availability.includes(a)} onClick={() => toggle("availability", a)}>
                  {a}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Dance styles">
            <div className="flex flex-wrap gap-2">
              {DANCE_STYLES.map((s) => (
                <Chip key={s} on={form.dance_styles.includes(s)} onClick={() => toggle("dance_styles", s)} variant="yellow">
                  {s}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Favorite style">
            <div className="flex flex-wrap gap-2">
              {(form.dance_styles.length > 0 ? form.dance_styles : DANCE_STYLES).map((s) => (
                <Chip
                  key={s}
                  on={form.favorite_style === s}
                  onClick={() => setForm({ ...form, favorite_style: form.favorite_style === s ? "" : s })}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <Input
                value={form.age}
                onChange={(v) => {
                  setAgeError(null);
                  setForm({ ...form, age: v.replace(/[^0-9]/g, "").slice(0, 2) });
                }}
                placeholder="e.g. 27"
              />
              {ageError && <p className="mt-1 px-1 text-xs font-medium text-destructive">{ageError}</p>}
            </Field>
          </div>
          <Field label="Languages">
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <Chip key={l} on={form.languages.includes(l)} onClick={() => toggle("languages", l)}>
                  {l}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Social links">
            <div className="space-y-2">
              {form.socials.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={s.label} onChange={(v) => updateSocial(i, { label: v })} placeholder="Label" />
                  <Input value={s.url} onChange={(v) => updateSocial(i, { url: v })} placeholder="https://" />
                  <button onClick={() => removeSocial(i)} aria-label="Remove link" className="rounded-full bg-baila-ink/5 px-3 text-sm">
                    ×
                  </button>
                </div>
              ))}
              {form.socials.length < 3 && (
                <button onClick={addSocial} className="text-xs font-semibold text-baila-ink/70 underline underline-offset-2">
                  + Add link
                </button>
              )}
            </div>
          </Field>
        </div>

        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-baila-ink/70">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-baila-ink px-5 py-2.5 text-sm font-semibold text-baila-cream disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function initial(p: Profile) {
  return {
    display_name: p.display_name ?? "",
    username: p.username ?? "",
    bio: p.bio ?? "",
    headline: p.headline ?? "",
    city: p.city ?? "",
    experience: (p.experience ?? "Beginner") as Experience,
    years_dancing: p.years_dancing != null ? String(p.years_dancing) : "",
    age: p.age != null ? String(p.age) : "",
    languages: p.languages ?? [],
    favorite_style: p.favorite_style ?? "",
    role: p.role,
    availability: p.availability ?? [],
    dance_styles: p.dance_styles ?? [],
    socials: p.socials ?? [],
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-baila-ink/50">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px] focus-visible:border-baila-ink focus-visible:outline-none"
    />
  );
}

function Chip({
  on,
  onClick,
  children,
  variant = "ink",
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "ink" | "yellow";
}) {
  const onClass = variant === "yellow" ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink text-baila-cream";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${on ? onClass : "bg-baila-ink/5 text-baila-ink/70"}`}
    >
      {children}
    </button>
  );
}
