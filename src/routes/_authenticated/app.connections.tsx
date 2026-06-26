import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Star, MapPin, Play, Sparkles, Music2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/baila/SignedMedia";
import { useSession } from "@/lib/auth";
import type { ConnectionRequest, DanceVideo, Profile } from "@/lib/baila-types";

export const Route = createFileRoute("/_authenticated/app/connections")({
  head: () => ({
    meta: [
      { title: "Connections — Baila" },
      { name: "description", content: "Your dance connections." },
    ],
  }),
  component: ConnectionsPage,
});

type EnrichedConnection = {
  request: ConnectionRequest;
  other: Profile;
  mainVideo: DanceVideo | null;
  direction: "in" | "out";
};

async function fetchConnections(userId: string): Promise<EnrichedConnection[]> {
  const { data: reqs } = await supabase
    .from("connection_requests")
    .select("*")
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .order("updated_at", { ascending: false });
  if (!reqs || reqs.length === 0) return [];

  const otherIds = Array.from(
    new Set(
      (reqs as ConnectionRequest[]).map((r) => (r.from_user === userId ? r.to_user : r.from_user)),
    ),
  );

  const [{ data: profiles }, { data: videos }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", otherIds),
    supabase.from("dance_videos").select("*").in("user_id", otherIds).eq("is_main", true),
  ]);

  const pMap = new Map<string, Profile>();
  (profiles as Profile[] | null)?.forEach((p) => pMap.set(p.id, p));
  const vMap = new Map<string, DanceVideo>();
  (videos as DanceVideo[] | null)?.forEach((v) => vMap.set(v.user_id, v));

  return (reqs as ConnectionRequest[])
    .map((r) => {
      const otherId = r.from_user === userId ? r.to_user : r.from_user;
      const other = pMap.get(otherId);
      if (!other) return null;
      return {
        request: r,
        other,
        mainVideo: vMap.get(otherId) ?? null,
        direction: (r.from_user === userId ? "out" : "in") as "in" | "out",
      };
    })
    .filter((x): x is EnrichedConnection => !!x);
}

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "past", label: "Past" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function ConnectionsPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["connections", user?.id],
    queryFn: () => fetchConnections(user!.id),
    enabled: !!user,
  });

  const items = data ?? [];
  const grouped: Record<TabKey, EnrichedConnection[]> = {
    pending: items.filter((c) => c.request.status === "pending"),
    active: items.filter((c) => c.request.status === "accepted"),
    past: items.filter((c) => c.request.status === "declined"),
  };
  const visible = grouped[tab];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["connections", user?.id] });

  const accept = async (id: string) => {
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "accepted" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Connection accepted — meet for real soon.");
      invalidate();
    }
  };

  const decline = async (id: string) => {
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "declined" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else invalidate();
  };

  const toggleAgain = async (c: EnrichedConnection) => {
    const userIsFrom = c.request.from_user === user?.id;
    const patch = userIsFrom
      ? { again_from: !c.request.again_from }
      : { again_to: !c.request.again_to };
    const { error } = await supabase
      .from("connection_requests")
      .update(patch)
      .eq("id", c.request.id);
    if (error) toast.error(error.message);
    else invalidate();
  };

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-baila-ink">Connections</h1>
        <p className="mt-1 text-sm text-baila-ink/60">
          Real people, real dances. No chatting required.
        </p>
      </header>

      <div className="mb-5 flex rounded-full bg-baila-ink/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-baila-yellow text-baila-ink shadow-sm"
                : "text-baila-ink/60"
            }`}
          >
            {t.label}
            {grouped[t.key].length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{grouped[t.key].length}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-2xl bg-baila-ink/5" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ul className="space-y-3">
          {visible.map((c) => {
            const userIsFrom = c.request.from_user === user?.id;
            const danceAgain = userIsFrom ? c.request.again_from : c.request.again_to;
            const otherName = c.other.display_name || c.other.username || "Dancer";
            return (
              <li
                key={c.request.id}
                className="flex items-center gap-3 rounded-2xl border border-baila-ink/10 bg-white p-3"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-baila-ink">
                  {c.mainVideo ? (
                    <SignedImage
                      bucket="dance-videos"
                      path={c.mainVideo.poster_url ?? c.mainVideo.storage_path}
                      alt={`${otherName} dance video`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-baila-yellow-soft text-baila-ink/40">
                      <Music2 className="h-5 w-5" />
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur">
                      <Play className="h-3 w-3" fill="currentColor" />
                    </span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-lg font-semibold text-baila-ink">
                      {otherName}
                    </p>
                    {c.other.dance_styles[0] && (
                      <span className="rounded-full bg-baila-yellow px-2 py-0.5 text-[10px] font-bold text-baila-ink">
                        {c.other.dance_styles[0]}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-baila-ink/60">
                    {c.other.city && (
                      <>
                        <MapPin className="h-3 w-3" /> {c.other.city}
                      </>
                    )}
                    {c.request.status === "pending" && c.direction === "out" && (
                      <span className="ml-2 italic">· awaiting reply</span>
                    )}
                  </div>
                </div>
                {c.request.status === "pending" && c.direction === "in" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => decline(c.request.id)}
                      aria-label="Decline"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-ink/5 text-baila-ink/70"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => accept(c.request.id)}
                      aria-label="Accept"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-green text-white"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </div>
                )}
                {(c.request.status === "accepted" || c.request.status === "declined") && (
                  <button
                    onClick={() => toggleAgain(c)}
                    aria-label="Dance again"
                    className={`flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold transition ${
                      danceAgain
                        ? "bg-baila-yellow text-baila-ink"
                        : "bg-baila-ink/5 text-baila-ink/70"
                    }`}
                  >
                    <Star className="h-4 w-4" fill={danceAgain ? "currentColor" : "none"} />
                    Again
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const copy = {
    pending: "No pending requests. Keep dancing — someone might say yes soon.",
    active: "No active connections yet. Find someone whose energy matches yours.",
    past: "Past dances will appear here.",
  }[tab];
  return (
    <div className="mt-12 rounded-3xl border border-dashed border-baila-ink/15 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-baila-yellow">
        <Sparkles className="h-6 w-6 text-baila-ink" />
      </div>
      <p className="mb-5 text-sm text-baila-ink/70">{copy}</p>
      <Link
        to="/app/dance"
        className="inline-flex items-center gap-1 rounded-full bg-baila-ink px-4 py-2.5 text-xs font-semibold text-baila-cream"
      >
        Find dancers
      </Link>
    </div>
  );
}
