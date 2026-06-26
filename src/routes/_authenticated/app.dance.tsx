import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles, Music2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DanceCard, type FeedItem } from "@/components/baila/DanceCard";
import { useSession } from "@/lib/auth";
import type { Profile, DanceVideo } from "@/lib/baila-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/app/dance")({
  head: () => ({
    meta: [
      { title: "Dance — Baila" },
      { name: "description", content: "Discover dancers through movement." },
    ],
  }),
  component: DancePage,
});

async function fetchFeed(userId: string): Promise<FeedItem[]> {
  const { data: blocked } = await supabase
    .from("connection_requests")
    .select("from_user,to_user")
    .or(`from_user.eq.${userId},to_user.eq.${userId}`);
  const exclude = new Set<string>([userId]);
  blocked?.forEach((r) => {
    exclude.add(r.from_user);
    exclude.add(r.to_user);
  });

  const { data: videos } = await supabase
    .from("dance_videos")
    .select("*")
    .eq("is_main", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!videos) return [];

  const candidates = (videos as DanceVideo[]).filter((v) => !exclude.has(v.user_id));
  if (candidates.length === 0) return [];

  const ids = candidates.map((v) => v.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids);
  const map = new Map<string, Profile>();
  (profiles as Profile[] | null)?.forEach((p) => map.set(p.id, p));

  return candidates
    .map((v) => {
      const p = map.get(v.user_id);
      return p ? { profile: p, mainVideo: v } : null;
    })
    .filter((x): x is FeedItem => !!x);
}

function DancePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["feed", user?.id],
    queryFn: () => fetchFeed(user!.id),
    enabled: !!user,
  });

  const items = data ?? [];
  const current = items[index];

  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [items.length, index]);

  const next = () => setIndex((i) => (items.length ? (i + 1) % items.length : 0));

  const confirmDance = async () => {
    if (!current || !user) return;
    setConfirmOpen(false);
    const { error } = await supabase.from("connection_requests").insert({
      from_user: user.id,
      to_user: current.profile.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Request sent to ${current.profile.display_name ?? "dancer"}`, {
      description: "If they say yes, you'll meet in Connections.",
    });
    await qc.invalidateQueries({ queryKey: ["feed", user.id] });
    await qc.invalidateQueries({ queryKey: ["connections", user.id] });
    next();
  };

  return (
    <div className="flex h-[100dvh] flex-col px-4 pb-28 pt-4">
      <header className="mb-3 flex items-center justify-between px-1">
        <span className="font-display text-2xl font-semibold text-baila-ink">Baila</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-baila-ink/50">
          Dance
        </span>
      </header>

      <div className="relative flex-1">
        {isLoading ? (
          <div className="absolute inset-0 animate-pulse rounded-[2rem] bg-baila-ink/10" />
        ) : !current ? (
          <EmptyFeed onUploadClick={() => navigate({ to: "/app/profile" })} />
        ) : (
          <AnimatePresence mode="wait">
            <div key={current.profile.id} className="absolute inset-0">
              <DanceCard item={current} />
            </div>
          </AnimatePresence>
        )}
      </div>

      {current && (
        <div className="mt-5 flex items-center justify-center gap-6">
          <button
            aria-label="Next"
            onClick={next}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-baila-orange text-white shadow-lg shadow-baila-orange/30 transition active:scale-95"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={2.5} />
          </button>
          <button
            aria-label="Dance with me"
            onClick={() => setConfirmOpen(true)}
            className="flex h-20 items-center gap-2 rounded-full bg-baila-green px-7 text-white shadow-lg shadow-baila-green/30 transition active:scale-95"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Dance With Me</span>
          </button>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              Dance with {current?.profile.display_name ?? "this dancer"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We'll let them know. No chatting — if they say yes, you'll meet for real.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Not now</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDance}
              className="rounded-full bg-baila-green text-white hover:bg-baila-green/90"
            >
              Yes, send request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyFeed({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-baila-ink/15 bg-baila-yellow-soft px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-baila-yellow">
        <Music2 className="h-7 w-7 text-baila-ink" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-baila-ink">No dancers yet</h2>
      <p className="mt-2 max-w-xs text-sm text-baila-ink/70">
        Baila grows when dancers share their moves. Upload your first clip so others can find
        you — and check back as the community arrives.
      </p>
      <button
        onClick={onUploadClick}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-baila-ink px-5 py-3 text-sm font-semibold text-baila-cream"
      >
        <Upload className="h-4 w-4" /> Upload your dance
      </button>
      <Link to="/app/connections" className="mt-3 text-xs font-semibold text-baila-ink/60 underline-offset-2 hover:underline">
        See your connections
      </Link>
    </div>
  );
}
