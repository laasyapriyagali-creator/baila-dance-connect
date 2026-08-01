import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { DanceCard, type FeedItem } from "@/components/baila/DanceCard";
import { DANCE_STYLES, type Profile, type DanceVideo } from "@/lib/baila-types";
import { prewarm } from "@/lib/storage";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/app/dance")({
  component: DanceFeed,
});

function DanceFeed() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const [activeIdx, setActiveIdx] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [styleFilter, setStyleFilter] = useState<string[]>([]);
  const [cityOnly, setCityOnly] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | { kind: "next" | "match"; item: FeedItem }>(null);

  const { data: me } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data as Profile | null;
    },
  });

  const { data: feed, isLoading } = useQuery({
    queryKey: ["feed", user?.id, styleFilter, cityOnly, me?.city],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      // Single relation pull: pending/declined sent by me OR accepted in either direction.
      const [videosRes, relRes] = await Promise.all([
        supabase
          .from("dance_videos")
          .select("*")
          .eq("is_main", true)
          .neq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("connection_requests")
          .select("from_user,to_user,status")
          .or(`from_user.eq.${user!.id},to_user.eq.${user!.id}`),
      ]);
      const excluded = new Set<string>();
      (relRes.data ?? []).forEach((r) => {
        if (r.from_user === user!.id) excluded.add(r.to_user);
        if (r.status === "accepted") {
          excluded.add(r.from_user);
          excluded.add(r.to_user);
        }
      });
      const vids = (videosRes.data ?? []).filter((v) => !excluded.has(v.user_id)) as DanceVideo[];
      if (vids.length === 0) return [] as FeedItem[];
      const ids = Array.from(new Set(vids.map((v) => v.user_id)));
      const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p as Profile]));
      const mineStyles = new Set(me?.dance_styles ?? []);
      const now = Date.now();
      const score = (it: FeedItem) => {
        let s = 0;
        for (const st of it.profile.dance_styles) if (mineStyles.has(st)) s += 3;
        if (me?.city && it.profile.city === me.city) s += 2;
        s += Math.max(0, 5 - (now - new Date(it.mainVideo.created_at).getTime()) / 86_400_000);
        return s;
      };
      const items: FeedItem[] = [];
      for (const v of vids) {
        const p = map.get(v.user_id);
        if (!p) continue;
        if (styleFilter.length && !p.dance_styles.some((s) => styleFilter.includes(s))) continue;
        if (cityOnly && me?.city && p.city !== me.city) continue;
        items.push({ profile: p, mainVideo: v });
      }
      const sorted = items.sort((a, b) => score(b) - score(a));
      // Pre-warm first few signed URLs so the initial paint has video + poster ready.
      const first = sorted.slice(0, 3);
      prewarm("dance-videos", first.map((f) => f.mainVideo.storage_path));
      prewarm("dance-videos", first.map((f) => f.mainVideo.poster_url));
      return sorted;
    },
  });

  // Snap-scroll active index tracking via IntersectionObserver.
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
  }, [feed?.length]);

  // Pause non-active videos; preload neighbors. Prewarm signed URLs for upcoming.
  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (!v) return;
      if (idx === activeIdx) {
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => undefined);
      } else {
        v.pause();
      }
    });
    const upcoming = (feed ?? []).slice(activeIdx, activeIdx + 4);
    if (upcoming.length) {
      prewarm("dance-videos", upcoming.map((f) => f.mainVideo.storage_path));
      prewarm("dance-videos", upcoming.map((f) => f.mainVideo.poster_url));
    }
  }, [activeIdx, feed]);

  const decide = async (kind: "next" | "match", item: FeedItem) => {
    if (!user) return;
    if (kind === "next") {
      const { error } = await supabase
        .from("connection_requests")
        .upsert(
          { from_user: user.id, to_user: item.profile.id, status: "declined" },
          { onConflict: "from_user,to_user" },
        );
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("connection_requests")
        .upsert(
          { from_user: user.id, to_user: item.profile.id, status: "pending" },
          { onConflict: "from_user,to_user" },
        );
      if (error) toast.error(error.message);
      else toast.success(`Asked ${item.profile.display_name ?? "them"} to dance`);
    }
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["unseen-counts"] });
    setPendingAction(null);
  };

  const items = useMemo(() => feed ?? [], [feed]);

  return (
    <div className="relative h-[100dvh]">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-3" style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}>
        <h1 className="font-display text-2xl font-bold text-white drop-shadow">Baila</h1>
        <div className="flex gap-2">
          <button
            aria-label="Filters"
            onClick={() => setFiltersOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            aria-label="Dance dates"
            onClick={() => navigate({ to: "/app/date" })}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {isLoading && (
          <div className="flex h-full items-center justify-center text-baila-ink/60">Loading dancers…</div>
        )}
        {!isLoading && items.length === 0 && <EmptyFeed />}

        {items.map((item, idx) => (
          <section
            key={item.mainVideo.id}
            data-feed-item
            data-idx={idx}
            className="relative h-[100dvh] snap-start px-3 pb-28 pt-2"
          >
            <DanceCard
              ref={(node) => {
                if (node) videoRefs.current.set(idx, node);
                else videoRefs.current.delete(idx);
              }}
              item={item}
              active={idx === activeIdx}
              preload={Math.abs(idx - activeIdx) <= 1}
              onDoubleTap={() => setPendingAction({ kind: "match", item })}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center gap-3 px-4">
              <button
                onClick={() => setPendingAction({ kind: "next", item })}
                className="pointer-events-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-baila-ink backdrop-blur"
              >
                <X className="h-4 w-4" /> Next
              </button>
              <button
                onClick={() => setPendingAction({ kind: "match", item })}
                className="pointer-events-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-baila-green text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" /> Dance with me
              </button>
            </div>
          </section>
        ))}
      </div>

      <AnimatePresence>
        {pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4"
            onClick={() => setPendingAction(null)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-baila-cream p-6"
            >
              <h3 className="font-display text-xl">
                {pendingAction.kind === "next"
                  ? `Pass on ${pendingAction.item.profile.display_name ?? "this dancer"}?`
                  : `Ask ${pendingAction.item.profile.display_name ?? "them"} to dance?`}
              </h3>
              <p className="mt-1 text-sm text-baila-ink/65">
                {pendingAction.kind === "next"
                  ? "We'll stop showing this dancer in your feed."
                  : "If they say yes, you'll meet up IRL — no chat needed."}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setPendingAction(null)}
                  className="flex-1 rounded-full bg-baila-ink/10 py-3 text-sm font-semibold text-baila-ink"
                >
                  Cancel
                </button>
                <button
                  onClick={() => decide(pendingAction.kind, pendingAction.item)}
                  className={`flex-1 rounded-full py-3 text-sm font-semibold text-white ${
                    pendingAction.kind === "next" ? "bg-baila-ink" : "bg-baila-green"
                  }`}
                >
                  {pendingAction.kind === "next" ? "Pass" : "Ask to dance"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">Tune your feed</SheetTitle>
            <SheetDescription>Show dancers that match your vibe.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
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
            </div>
            <label className="flex items-center justify-between rounded-2xl bg-baila-ink/5 px-4 py-3 text-sm">
              <span>
                <span className="font-semibold text-baila-ink">My city only</span>
                {me?.city && <span className="ml-2 text-baila-ink/55">({me.city})</span>}
              </span>
              <input type="checkbox" checked={cityOnly} onChange={(e) => setCityOnly(e.target.checked)} />
            </label>
            <button
              onClick={() => {
                setStyleFilter([]);
                setCityOnly(false);
              }}
              className="w-full rounded-full bg-baila-ink/5 py-3 text-sm font-semibold text-baila-ink"
            >
              Reset
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-baila-yellow">
        <Sparkles className="h-6 w-6 text-baila-ink" />
      </div>
      <h2 className="font-display text-2xl text-baila-ink">No new dancers right now</h2>
      <p className="text-sm text-baila-ink/65">
        Come back soon — or upload a video so others find you first.
      </p>
    </div>
  );
}
