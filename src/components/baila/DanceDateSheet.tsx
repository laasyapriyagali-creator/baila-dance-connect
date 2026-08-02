import { useMemo, useState } from "react";
import { CalendarPlus, ShieldCheck, Shuffle, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button, Field, Input, Textarea } from "@/components/ui-baila";
import { ICE_BREAKERS, SAFETY_CHECKLIST, type ConnectionRequest, type DanceDate, type Profile } from "@/lib/baila-types";
import { suggestVenues } from "@/lib/venues";
import { buildIcs, downloadIcs } from "@/lib/ics";

/** dance_dates isn't in the generated Supabase types yet — narrow cast at the edge. */
const danceDatesTable = () => (supabase as unknown as { from: (t: "dance_dates") => any }).from("dance_dates");

function toLocalInput(iso: string | null | undefined) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 2 * 86_400_000);
  if (!iso) d.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DanceDateSheet({
  request,
  other,
  userId,
  existingDate,
  trustedContact,
  onSaved,
}: {
  request: ConnectionRequest;
  other: Profile;
  userId: string;
  existingDate: DanceDate | null;
  trustedContact: string | null;
  onSaved: (d: DanceDate) => void;
}) {
  const otherName = other.display_name || other.username || "your dance partner";
  const sharedStyles = useMemo(() => other.dance_styles ?? [], [other.dance_styles]);
  const venueIdeas = useMemo(() => suggestVenues(sharedStyles, other.city), [sharedStyles, other.city]);

  const [iceBreaker, setIceBreaker] = useState(
    () => ICE_BREAKERS[Math.floor(Math.random() * ICE_BREAKERS.length)],
  );
  const [when, setWhen] = useState(() => toLocalInput(existingDate?.starts_at));
  const [venue, setVenue] = useState(existingDate?.venue ?? "");
  const [notes, setNotes] = useState(existingDate?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const exportIcs = () => {
    const start = new Date(when);
    if (Number.isNaN(start.getTime())) return toast.error("Pick a valid date and time");
    const ics = buildIcs({
      title: `Dance date with ${otherName}`,
      description: `Style: ${sharedStyles[0] ?? "your call"}\nIce-breaker: ${iceBreaker}`,
      location: venue || other.city || "",
      start,
      durationMinutes: 60,
    });
    downloadIcs(`baila-${otherName.toLowerCase().replace(/\s+/g, "-")}`, ics);
    toast.success("Calendar invite ready");
  };

  const save = async () => {
    if (!venue.trim()) return toast.error("Pick or type a spot first");
    const start = new Date(when);
    if (Number.isNaN(start.getTime())) return toast.error("Pick a valid date and time");
    setSaving(true);
    try {
      const { data, error } = await danceDatesTable()
        .upsert(
          {
            request_id: request.id,
            created_by: userId,
            venue: venue.trim(),
            style: sharedStyles[0] ?? null,
            starts_at: start.toISOString(),
            notes: notes.trim() || null,
          },
          { onConflict: "request_id" },
        )
        .select()
        .single();
      if (error) throw error;
      toast.success("Dance date saved — see you on the floor.");
      onSaved(data as DanceDate);
    } catch {
      toast.error("Couldn't save your dance date. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-rise bg-gradient-soft border-t border-baila-ink/[0.06] p-4">
      <div className="flex items-start gap-2.5 rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-soft">
        <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-baila-ink/45" />
        <div className="min-w-0 flex-1 text-sm leading-relaxed text-baila-ink/85">{iceBreaker}</div>
        <button
          onClick={() => setIceBreaker(ICE_BREAKERS[Math.floor(Math.random() * ICE_BREAKERS.length)])}
          className="press flex shrink-0 items-center gap-1 rounded-full bg-baila-ink/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-baila-ink/55"
        >
          <Shuffle className="h-3 w-3" /> Shuffle
        </button>
      </div>

      <p className="mb-2 mt-4 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-baila-ink/45">
        Spot ideas
      </p>
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {venueIdeas.map((s) => (
          <button
            key={s.name}
            onClick={() => setVenue(s.name)}
            className={`press w-40 shrink-0 rounded-2xl border p-3 text-left shadow-soft ${
              venue === s.name ? "border-baila-yellow bg-white" : "border-white/70 bg-white/85"
            }`}
          >
            <p className="font-display text-sm font-semibold text-baila-ink">{s.name}</p>
            <p className="mt-1 text-[11px] leading-snug text-baila-ink/55">{s.vibe}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        <Field label="When">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="py-3" />
        </Field>
        <Field label="Where">
          <Input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder={other.city ? `Studio or social in ${other.city}` : "Studio or social"}
            className="py-3"
          />
        </Field>
        <Field label="Notes (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to add — songs, gear, meeting spot"
            rows={2}
          />
        </Field>
      </div>

      <div className="mt-4 rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-soft">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-baila-ink/50">
          <ShieldCheck className="h-3.5 w-3.5" /> Safety first
        </p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-baila-ink/70">
          {SAFETY_CHECKLIST.map((item) => (
            <li key={item} className="flex gap-1.5">
              <span className="text-baila-ink/30">•</span> {item}
            </li>
          ))}
          {trustedContact && (
            <li className="flex gap-1.5 font-semibold text-baila-ink">
              <span className="text-baila-ink/30">•</span> Your trusted contact: {trustedContact}
            </li>
          )}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button variant="secondary" className="h-12" onClick={exportIcs}>
          <CalendarPlus className="h-4 w-4" /> Add to calendar
        </Button>
        <Button variant="ink" className="h-12" onClick={save} disabled={saving}>
          {saving ? "Saving…" : existingDate ? "Update plan" : "Confirm plan"}
        </Button>
      </div>
      <p className="mt-2.5 text-center text-[11px] text-baila-ink/50">
        No chat needed — show up, dance, see what happens.
      </p>
    </div>
  );
}
