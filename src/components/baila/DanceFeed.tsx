import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, SlidersHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { ReelVideo } from "@/components/baila/ReelVideo";
import { bailaStore, DANCE_STYLES } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";

export function DanceFeed({ onAddReel }: { onAddReel: () => void }) {
  const { reels, dates, passed } = useBaila();
  const [styleFilter, setStyleFilter] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const invited = useMemo(() => new Set(dates.map((d) => d.reelId)), [dates]);
  const items = useMemo(
    () =>
      reels.filter(
        (r) =>
          !passed.includes(r.id) &&
          !invited.has(r.id) &&
          (styleFilter.length === 0 || styleFilter.includes(r.style)),
      ),
    [reels, passed, invited, styleFilter],
  );

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIdx(idx);
          }
        });
      },
      { root, threshold: [0.6] },
    );
    root.querySelectorAll("[data-feed-item]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  return (
    <div className="relative h-[100dvh]">
      <header
        className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <h1 className="font-display text-2xl font-bold text-white drop-shadow">Baila</h1>
        <div className="flex gap-2">
          <button
            aria-label="Filters"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            aria-label="Add reel"
            onClick={onAddReel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>

      {filtersOpen && (
        <div className="absolute inset-x-3 top-16 z-30 rounded-3xl bg-baila-cream/95 p-4 backdrop-blur">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-baila-ink/55">Styles</p>
          <div className="flex flex-wrap gap-2">
            {DANCE_STYLES.map((s) => (
              <button
                key={s}
                onClick={() =>
                  setStyleFilter((prev) =>
                    prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                  )
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  styleFilter.includes(s)
                    ? "bg-baila-yellow text-baila-ink"
                    : "bg-baila-ink/5 text-baila-ink/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStyleFilter([])}
            className="mt-3 w-full rounded-full bg-baila-ink/5 py-2.5 text-xs font-semibold text-baila-ink"
          >
            Reset filters
          </button>
        </div>
      )}

      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {items.length === 0 ? (
          <EmptyFeed
            hasReels={reels.length > 0}
            onAddReel={onAddReel}
            onReset={() => {
              bailaStore.resetPassed();
              toast.success("Feed refreshed");
            }}
          />
        ) : (
          items.map((reel, idx) => (
            <section
              key={reel.id}
              data-feed-item
              data-idx={idx}
              className="relative h-[100dvh] snap-start px-3 pb-28 pt-2"
            >
              <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-baila-ink">
                {idx === activeIdx ? (
                  <ReelVideo reel={reel} autoPlay muted className="h-full w-full object-cover" />
                ) : reel.poster ? (
                  <img src={reel.poster} alt="" className="h-full w-full object-cover" />
                ) : null}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pb-16">
                  <p className="font-display text-2xl font-semibold text-white">{reel.dancer}</p>
                  <p className="mt-1 text-sm text-white/80">
                    {reel.style}
                    {reel.caption ? ` · ${reel.caption}` : ""}
                  </p>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center gap-3 px-4">
                <button
                  onClick={() => bailaStore.pass(reel.id)}
                  className="pointer-events-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-baila-ink backdrop-blur"
                >
                  <X className="h-4 w-4" /> Next
                </button>
                <button
                  onClick={() => {
                    bailaStore.inviteToDance(reel);
                    toast.success(`Asked ${reel.dancer} to dance`);
                  }}
                  className="pointer-events-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-baila-ink text-sm font-semibold text-baila-cream"
                >
                  <Sparkles className="h-4 w-4" /> Dance with me
                </button>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyFeed({
  hasReels,
  onAddReel,
  onReset,
}: {
  hasReels: boolean;
  onAddReel: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 pb-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-baila-yellow">
        <Sparkles className="h-6 w-6 text-baila-ink" />
      </div>
      <h2 className="font-display text-2xl text-baila-ink">
        {hasReels ? "You've seen every reel" : "The floor is empty"}
      </h2>
      <p className="text-sm text-baila-ink/65">
        {hasReels
          ? "Bring the passed reels back, or add a new one."
          : "Add a dance reel and the feed comes alive — movement first, always."}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={onAddReel}
          className="rounded-full bg-baila-ink px-6 py-3 text-sm font-semibold text-baila-cream"
        >
          Add a reel
        </button>
        {hasReels && (
          <button
            onClick={onReset}
            className="rounded-full bg-baila-ink/10 px-6 py-3 text-sm font-semibold text-baila-ink"
          >
            Reset feed
          </button>
        )}
      </div>
    </div>
  );
}
