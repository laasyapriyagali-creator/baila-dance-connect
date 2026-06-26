import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, GraduationCap, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DANCE_STYLES, type AppRole, type DanceClass, type DanceEvent } from "@/lib/baila-types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ManageContent({ userId, role }: { userId: string; role: AppRole }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const classesQ = useQuery({
    enabled: role === "instructor",
    queryKey: ["my-classes", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("classes")
        .select("*")
        .eq("instructor_id", userId)
        .order("created_at", { ascending: false });
      return (data ?? []) as DanceClass[];
    },
  });

  const eventsQ = useQuery({
    enabled: role === "organizer",
    queryKey: ["my-events", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", userId)
        .order("starts_at", { ascending: true });
      return (data ?? []) as DanceEvent[];
    },
  });

  const isInstructor = role === "instructor";
  const items = isInstructor ? classesQ.data ?? [] : eventsQ.data ?? [];
  const Icon = isInstructor ? GraduationCap : CalendarDays;
  const title = isInstructor ? "Classes" : "Events";

  const remove = async (id: string) => {
    const table = isInstructor ? "classes" : "events";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: [isInstructor ? "my-classes" : "my-events", userId] });
    }
  };

  return (
    <section className="mt-7 px-5">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-baila-ink">
          <Icon className="h-5 w-5" /> {title}
        </h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-full bg-baila-ink px-3.5 py-2 text-xs font-semibold text-baila-cream"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-baila-ink/15 bg-white px-5 py-8 text-center text-sm text-baila-ink/55">
          Publish a {isInstructor ? "class" : "event"} so dancers can find you.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-2 rounded-2xl border border-baila-ink/10 bg-white p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-baila-ink">{it.title}</p>
                <p className="text-xs text-baila-ink/60">
                  {isInstructor
                    ? `${(it as DanceClass).style} · ${(it as DanceClass).level}${(it as DanceClass).city ? ` · ${(it as DanceClass).city}` : ""}`
                    : `${new Date((it as DanceEvent).starts_at).toLocaleString()}${(it as DanceEvent).city ? ` · ${(it as DanceEvent).city}` : ""}`}
                </p>
              </div>
              <button
                onClick={() => remove(it.id)}
                aria-label="Remove"
                className="rounded-full p-2 text-baila-ink/50 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <ContentDialog
          role={role}
          userId={userId}
          onClose={() => setOpen(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: [isInstructor ? "my-classes" : "my-events", userId] });
            setOpen(false);
          }}
        />
      )}
    </section>
  );
}

function ContentDialog({
  role,
  userId,
  onClose,
  onSaved,
}: {
  role: AppRole;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isInstructor = role === "instructor";
  const [form, setForm] = useState({
    title: "",
    style: DANCE_STYLES[0] as string,
    level: "all",
    city: "",
    description: "",
    starts_at: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
    venue: "",
    recurrence: "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return toast.error("Add a title");
    setSaving(true);
    if (isInstructor) {
      const { error } = await supabase.from("classes").insert({
        instructor_id: userId,
        title: form.title.trim(),
        style: form.style,
        level: form.level,
        city: form.city.trim() || null,
        recurrence: form.recurrence.trim() || null,
        description: form.description.trim() || null,
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Class published");
        onSaved();
      }
    } else {
      const { error } = await supabase.from("events").insert({
        organizer_id: userId,
        title: form.title.trim(),
        style: form.style,
        city: form.city.trim() || null,
        venue: form.venue.trim() || null,
        starts_at: new Date(form.starts_at).toISOString(),
        description: form.description.trim() || null,
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Event published");
        onSaved();
      }
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            New {isInstructor ? "class" : "event"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              className="rounded-2xl border border-baila-ink/15 bg-white px-3 py-3 text-sm"
            >
              {DANCE_STYLES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {isInstructor ? (
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="rounded-2xl border border-baila-ink/15 bg-white px-3 py-3 text-sm"
              >
                <option value="all">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            ) : (
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="rounded-2xl border border-baila-ink/15 bg-white px-3 py-3 text-sm"
              />
            )}
          </div>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="City"
            className="w-full rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px]"
          />
          {isInstructor ? (
            <input
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              placeholder="Recurrence (e.g. Tuesdays 7pm)"
              className="w-full rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px]"
            />
          ) : (
            <input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="Venue"
              className="w-full rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px]"
            />
          )}
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Description (optional)"
            className="w-full resize-none rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px]"
          />
        </div>
        <DialogFooter>
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-baila-ink/70">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-baila-ink px-5 py-2.5 text-sm font-semibold text-baila-cream disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
