import { useMemo, useState } from "react";
import { CalendarPlus, MapPin, Trash2, Heart, Download } from "lucide-react";
import { toast } from "sonner";
import { bailaStore, ICE_BREAKERS, type DanceDate } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";
import { downloadIcs } from "@/lib/ics";

export function DatesPanel() {
  const { dates, reels } = useBaila();
  const reelById = useMemo(() => new Map(reels.map((r) => [r.id, r])), [reels]);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="min-h-[100dvh] px-4 pb-28 pt-6" style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}>
      <h1 className="font-display text-3xl font-semibold text-baila-ink">Dance dates</h1>
      <p className="mt-1 text-sm text-baila-ink/65">
        Plan where you'll actually meet. No chatting — just a time and a floor.
      </p>

      {dates.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-baila-yellow">
            <Heart className="h-6 w-6 text-baila-ink" />
          </div>
          <h2 className="font-display text-xl text-baila-ink">No dance dates yet</h2>
          <p className="max-w-xs text-sm text-baila-ink/65">
            Tap “Dance with me” on a reel in the Dance tab and it lands here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {dates.map((d) => {
            const reel = reelById.get(d.reelId);
            const open = openId === d.id;
            return (
              <li key={d.id} className="overflow-hidden rounded-3xl bg-white/70">
                <div className="flex items-center gap-3 p-3">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-baila-ink">
                    {reel?.poster && <img src={reel.poster} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-baila-ink">{d.dancer}</p>
                    <p className="truncate text-xs text-baila-ink/60">
                      {d.status === "planned" && d.when
                        ? `${new Date(d.when).toLocaleString()}${d.place ? ` · ${d.place}` : ""}`
                        : "Invited — set a time & place"}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenId(open ? null : d.id)}
                    className="rounded-full bg-baila-ink px-4 py-2 text-xs font-semibold text-baila-cream"
                  >
                    {open ? "Close" : "Plan"}
                  </button>
                </div>
                {open && <Planner date={d} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Planner({ date }: { date: DanceDate }) {
  const [when, setWhen] = useState(date.when ? date.when.slice(0, 16) : "");
  const [place, setPlace] = useState(date.place);
  const [note, setNote] = useState(date.note);
  const iceBreaker = ICE_BREAKERS[Math.abs(hash(date.id)) % ICE_BREAKERS.length];

  const save = () => {
    if (!when) {
      toast.error("Pick a date and time");
      return;
    }
    bailaStore.updateDate(date.id, {
      when: new Date(when).toISOString(),
      place,
      note,
      status: "planned",
    });
    toast.success("Dance date planned");
  };

  return (
    <div className="border-t border-baila-ink/10 bg-baila-cream/60 p-4">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">When</span>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="mt-1 w-full rounded-2xl bg-baila-ink/5 px-4 py-3 text-sm text-baila-ink outline-none"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Where</span>
        <div className="mt-1 flex items-center gap-2 rounded-2xl bg-baila-ink/5 px-4">
          <MapPin className="h-4 w-4 text-baila-ink/50" />
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Studio, plaza, social…"
            className="w-full bg-transparent py-3 text-sm text-baila-ink outline-none"
          />
        </div>
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Note</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Bring flat shoes"
          className="mt-1 w-full rounded-2xl bg-baila-ink/5 px-4 py-3 text-sm text-baila-ink outline-none"
        />
      </label>

      <p className="mt-3 rounded-2xl bg-baila-yellow/60 px-4 py-3 text-xs font-medium text-baila-ink">
        Ice-breaker: {iceBreaker}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={save}
          className="flex-1 rounded-full bg-baila-ink py-3 text-sm font-semibold text-baila-cream"
        >
          Save plan
        </button>
        <button
          onClick={() => {
            if (!date.when) return toast.error("Save a time first");
            downloadIcs({
              title: `Dance date with ${date.dancer}`,
              start: new Date(date.when),
              location: date.place,
              description: date.note,
            });
          }}
          aria-label="Add to calendar"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-baila-ink/10 text-baila-ink"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            bailaStore.removeDate(date.id);
            toast.success("Dance date removed");
          }}
          aria-label="Remove dance date"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-baila-ink/10 text-baila-ink"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-baila-ink/50">
        <CalendarPlus className="h-3.5 w-3.5" /> Saved on this device only.
      </p>
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
