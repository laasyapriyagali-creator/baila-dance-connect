import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DANCE_STYLES, type Experience, type Profile, type Social } from "@/lib/baila-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EXPERIENCES: Experience[] = ["Beginner", "Intermediate", "Advanced", "Pro"];

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
  const [form, setForm] = useState({
    display_name: profile.display_name ?? "",
    username: profile.username ?? "",
    bio: profile.bio ?? "",
    city: profile.city ?? "",
    experience: profile.experience ?? ("Beginner" as Experience),
    dance_styles: profile.dance_styles,
    socials: profile.socials,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        display_name: profile.display_name ?? "",
        username: profile.username ?? "",
        bio: profile.bio ?? "",
        city: profile.city ?? "",
        experience: profile.experience ?? "Beginner",
        dance_styles: profile.dance_styles,
        socials: profile.socials,
      });
    }
  }, [open, profile]);

  const toggleStyle = (s: string) =>
    setForm((f) => ({
      ...f,
      dance_styles: f.dance_styles.includes(s)
        ? f.dance_styles.filter((x) => x !== s)
        : [...f.dance_styles, s],
    }));

  const updateSocial = (i: number, patch: Partial<Social>) =>
    setForm((f) => ({
      ...f,
      socials: f.socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  const addSocial = () =>
    setForm((f) => ({ ...f, socials: [...f.socials, { label: "", url: "" }] }));
  const removeSocial = (i: number) =>
    setForm((f) => ({ ...f, socials: f.socials.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.display_name.trim()) {
      toast.error("Add a display name");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim(),
        username: form.username.trim() || null,
        bio: form.bio.trim() || null,
        city: form.city.trim() || null,
        experience: form.experience,
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
          <Field label="Display name">
            <Input
              value={form.display_name}
              onChange={(v) => setForm({ ...form, display_name: v })}
              placeholder="Your name"
            />
          </Field>
          <Field label="Username">
            <Input
              value={form.username}
              onChange={(v) =>
                setForm({ ...form, username: v.replace(/[^a-z0-9._]/gi, "").toLowerCase() })
              }
              placeholder="username"
            />
          </Field>
          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={160}
              rows={3}
              placeholder="A line about how you dance."
              className="w-full resize-none rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px] focus:border-baila-ink focus:outline-none"
            />
          </Field>
          <Field label="City">
            <Input
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              placeholder="Where you dance"
            />
          </Field>
          <Field label="Experience">
            <div className="flex flex-wrap gap-2">
              {EXPERIENCES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm({ ...form, experience: e })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    form.experience === e
                      ? "bg-baila-ink text-baila-cream"
                      : "bg-baila-ink/5 text-baila-ink/70"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Dance styles">
            <div className="flex flex-wrap gap-2">
              {DANCE_STYLES.map((s) => {
                const on = form.dance_styles.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      on
                        ? "bg-baila-yellow text-baila-ink"
                        : "bg-baila-ink/5 text-baila-ink/70"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Social links">
            <div className="space-y-2">
              {form.socials.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={s.label}
                    onChange={(v) => updateSocial(i, { label: v })}
                    placeholder="Label"
                  />
                  <Input
                    value={s.url}
                    onChange={(v) => updateSocial(i, { url: v })}
                    placeholder="https://"
                  />
                  <button
                    onClick={() => removeSocial(i)}
                    className="rounded-full bg-baila-ink/5 px-3 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              {form.socials.length < 3 && (
                <button
                  onClick={addSocial}
                  className="text-xs font-semibold text-baila-ink/70 underline underline-offset-2"
                >
                  + Add link
                </button>
              )}
            </div>
          </Field>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full px-4 py-2 text-sm font-semibold text-baila-ink/70"
          >
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-baila-ink/50">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px] focus:border-baila-ink focus:outline-none"
    />
  );
}
