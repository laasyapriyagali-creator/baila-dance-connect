import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, SlidersHorizontal, Sparkles, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { DanceCard, type FeedItem } from "@/components/baila/DanceCard";
import { DANCE_STYLES, type Profile, type DanceVideo } from "@/lib/baila-types";
import { prewarm } from "@/lib/storage";
import { Button, Chip, DanceLoader, EmptyState, IconButton, ModalSheet, Toggle } from "@/components/ui-baila";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/app/dance")({
  head: () => ({
    meta: [
      { title: "Dance — Baila" },
      { name: "description", content: "Discover dancers through movement and ask someone to share a floor." },
      { property: "og:title", content: "Dance — Baila" },
      { property: "og:description", content: "Discover dancers through movement and ask someone to share a floor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
  const activeFilters = styleFilter.length + (cityOnly ? 1 : 0);

  return (
    <div className="relative h-[100dvh] bg-baila-ink">
      <header
        className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.85rem)" }}
      >
        <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-white drop-shadow-md">Baila</h1>
        <div className="flex gap-2">
          <IconButton variant="glass" aria-label="Filters" onClick={() => setFiltersOpen(true)} className="relative">
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilters > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-baila-yellow px-1 text-[10px] font-bold text-baila-ink">
                {activeFilters}
              </span>
            )}
          </IconButton>
          <IconButton variant="glass" aria-label="Dance dates" onClick={() => navigate({ to: "/app/date" })}>
            <Bell className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      <div
        ref={containerRef}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto"
      >
        {isLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <DanceLoader label="Finding dancers near you…" />
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="flex h-full items-center justify-center px-6">
            <EmptyState
              tone="dark"
              icon={<Sparkles className="h-6 w-6" />}
              title="No new dancers right now"
              body="Come back soon — or upload a video so others discover you first."
              action={
                <Button variant="primary" onClick={() => navigate({ to: "/app/profile" })}>
                  Upload your dance
                </Button>
              }
            />
          </div>
        )}

        {items.map((item, idx) => (
          <section
            key={item.mainVideo.id}
            data-feed-item
            data-idx={idx}
            className="relative h-[100dvh] snap-start px-3 pb-32 pt-2"
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

            <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex items-center justify-center gap-3 px-5">
              <button
                onClick={() => setPendingAction({ kind: "next", item })}
                className="press pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white shadow-float backdrop-blur-md"
                aria-label="Next dancer"
              >
                <X className="h-6 w-6" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setPendingAction({ kind: "match", item })}
                className="press bg-gradient-baila pointer-events-auto flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-bold tracking-[-0.01em] text-baila-ink shadow-glow"
              >
                <Sparkles className="h-4 w-4" /> Dance with me
              </button>
            </div>
          </section>
        ))}
      </div>

      <ModalSheet
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
        label="Confirm action"
      >
        {pendingAction && (
          <>
            <span
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                pendingAction.kind === "next"
                  ? "bg-baila-ink/[0.06] text-baila-ink/60"
                  : "bg-gradient-baila text-baila-ink shadow-glow"
              }`}
            >
              {pendingAction.kind === "next" ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </span>
            <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-baila-ink">
              {pendingAction.kind === "next"
                ? `Pass on ${pendingAction.item.profile.display_name ?? "this dancer"}?`
                : `Ask ${pendingAction.item.profile.display_name ?? "them"} to dance?`}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-baila-ink/60">
              {pendingAction.kind === "next"
                ? "We'll stop showing this dancer in your feed."
                : "If they say yes, you'll meet up IRL — no chat needed."}
            </p>
            <div className="mt-6 flex gap-2.5">
              <Button variant="ghost" block className="h-12" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button
                variant={pendingAction.kind === "next" ? "ink" : "primary"}
                block
                className="h-12"
                onClick={() => decide(pendingAction.kind, pendingAction.item)}
              >
                {pendingAction.kind === "next" ? "Pass" : "Ask to dance"}
              </Button>
            </div>
          </>
        )}
      </ModalSheet>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] border-baila-ink/[0.07] bg-card">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl tracking-[-0.02em]">Tune your feed</SheetTitle>
            <SheetDescription>Show dancers that match your vibe.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 py-5">
            <div>
              <p className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-baila-ink/45">
                Styles
              </p>
              <div className="flex flex-wrap gap-2">
                {DANCE_STYLES.map((s) => (
                  <Chip
                    key={s}
                    active={styleFilter.includes(s)}
                    onClick={() =>
                      setStyleFilter((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                      )
                    }
                  >
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-baila-ink/[0.07] bg-white px-4 py-3.5 shadow-soft">
              <span className="text-sm">
                <span className="font-semibold text-baila-ink">My city only</span>
                {me?.city && <span className="ml-2 text-baila-ink/50">({me.city})</span>}
              </span>
              <Toggle checked={cityOnly} onCheckedChange={setCityOnly} label="My city only" />
            </div>
            <Button
              variant="ghost"
              block
              className="h-12"
              onClick={() => {
                setStyleFilter([]);
                setCityOnly(false);
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
