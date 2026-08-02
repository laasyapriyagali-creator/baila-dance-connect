import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, X, Star, MapPin, Play, Music2, ChevronDown, Heart, Clock, Sparkles, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/baila/SignedMedia";
import { DanceDateSheet } from "@/components/baila/DanceDateSheet";
import { useSession } from "@/lib/auth";
import { expireStaleRequests, fetchSettings, isExpiredPending } from "@/lib/baila-data";
import { REQUEST_TTL_HOURS, type ConnectionRequest, type DanceDate, type DanceVideo, type Profile } from "@/lib/baila-types";
import { Button, Card, EmptyState, Page, PageHeader, Pill, Segmented, Skeleton } from "@/components/ui-baila";

export const Route = createFileRoute("/_authenticated/app/date")({
  head: () => ({
    meta: [
      { title: "Date — Baila" },
      { name: "description", content: "Your dance partners and upcoming dance dates." },
      { property: "og:title", content: "Date — Baila" },
      { property: "og:description", content: "Your dance partners and upcoming dance dates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DatePage,
});

/** dance_dates isn't in the generated Supabase types yet — narrow cast at the edge. */
const danceDatesTable = () => (supabase as unknown as { from: (t: "dance_dates") => any }).from("dance_dates");

type EnrichedConnection = {
  request: ConnectionRequest;
  other: Profile;
  mainVideo: DanceVideo | null;
  direction: "in" | "out";
  danceDate: DanceDate | null;
};

async function fetchConnections(userId: string): Promise<EnrichedConnection[]> {
  await expireStaleRequests(userId);

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
  const reqIds = (reqs as ConnectionRequest[]).map((r) => r.id);

  const [{ data: profiles }, { data: videos }, { data: dates }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", otherIds),
    supabase.from("dance_videos").select("*").in("user_id", otherIds).eq("is_main", true),
    danceDatesTable().select("*").in("request_id", reqIds),
  ]);

  const pMap = new Map<string, Profile>();
  (profiles as Profile[] | null)?.forEach((p) => pMap.set(p.id, p));
  const vMap = new Map<string, DanceVideo>();
  (videos as DanceVideo[] | null)?.forEach((v) => vMap.set(v.user_id, v));
  const dMap = new Map<string, DanceDate>();
  ((dates as DanceDate[] | null) ?? []).forEach((d) => dMap.set(d.request_id, d));

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
        danceDate: dMap.get(r.id) ?? null,
      };
    })
    .filter((x): x is EnrichedConnection => !!x);
}

const TABS = [
  { key: "received", label: "Received" },
  { key: "sent", label: "Sent" },
  { key: "matches", label: "Matches" },
  { key: "past", label: "Past" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function effectiveStatus(c: EnrichedConnection): ConnectionRequest["status"] {
  if (isExpiredPending(c.request.status, c.request.created_at)) return "expired";
  return c.request.status;
}

function DatePage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("received");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["connections", user?.id],
    queryFn: () => fetchConnections(user!.id),
    enabled: !!user,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: () => fetchSettings(user!.id),
    enabled: !!user,
  });

  const items = useMemo(
    () => (data ?? []).map((c) => ({ ...c, status: effectiveStatus(c) })),
    [data],
  );

  const grouped: Record<TabKey, (EnrichedConnection & { status: ConnectionRequest["status"] })[]> = useMemo(
    () => ({
      received: items.filter((c) => c.direction === "in" && c.status === "pending"),
      sent: items.filter((c) => c.direction === "out" && c.status === "pending"),
      matches: items.filter((c) => c.status === "accepted"),
      past: items.filter((c) => c.status === "declined" || c.status === "expired" || c.status === "completed"),
    }),
    [items],
  );
  const visible = grouped[tab];

  useEffect(() => {
    if (!user || tab !== "received") return;
    const unseen = grouped.received.filter((c) => !c.request.seen_at).map((c) => c.request.id);
    if (unseen.length === 0) return;
    supabase
      .from("connection_requests")
      .update({ seen_at: new Date().toISOString() })
      .in("id", unseen)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["unseen-counts"] });
        qc.invalidateQueries({ queryKey: ["connections", user.id] });
      });
  }, [tab, grouped.received, user, qc]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["connections", user?.id] });

  const accept = async (id: string) => {
    const { error } = await supabase.from("connection_requests").update({ status: "accepted" }).eq("id", id);
    if (error) toast.error("Couldn't accept. Check your connection.");
    else {
      toast.success("It's a match — plan your dance.");
      invalidate();
    }
  };
  const decline = async (id: string) => {
    const { error } = await supabase.from("connection_requests").update({ status: "declined" }).eq("id", id);
    if (error) toast.error("Couldn't send request. Check your connection.");
    else invalidate();
  };
  const markCompleted = async (id: string) => {
    const { error } = await supabase.from("connection_requests").update({ status: "completed" }).eq("id", id);
    if (error) toast.error("Couldn't update. Check your connection.");
    else {
      toast.success("Marked as danced!");
      invalidate();
    }
  };
  const toggleAgain = async (c: EnrichedConnection) => {
    const userIsFrom = c.request.from_user === user?.id;
    const patch = userIsFrom ? { again_from: !c.request.again_from } : { again_to: !c.request.again_to };
    const { error } = await supabase.from("connection_requests").update(patch).eq("id", c.request.id);
    if (error) toast.error("Couldn't save. Check your connection.");
    else invalidate();
  };

  return (
    <Page>
      <PageHeader
        title="Date"
        subtitle="Your dance partners and upcoming dance dates — meet on the floor, not in a chat."
      />

      <Segmented
        className="mb-5"
        value={tab}
        onChange={setTab}
        options={TABS.map((t) => ({ key: t.key, label: t.label, count: grouped[t.key].length }))}
      />

      {isLoading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="flex items-center gap-3.5 p-3.5">
                <Skeleton className="h-[68px] w-[68px] rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <EmptyStateForTab tab={tab} />
      ) : (
        <ul className="space-y-3">
          {visible.map((c, i) => {
            const userIsFrom = c.request.from_user === user?.id;
            const danceAgain = userIsFrom ? c.request.again_from : c.request.again_to;
            const bothWantAgain = c.request.again_from && c.request.again_to;
            const otherName = c.other.display_name || c.other.username || "Dancer";
            const open = expanded === c.request.id;
            const hasFutureDate = !!c.danceDate && new Date(c.danceDate.starts_at).getTime() > Date.now();
            const hasPastDate = !!c.danceDate && new Date(c.danceDate.starts_at).getTime() <= Date.now();
            const canOpenPlanner = c.status === "accepted" || (c.status === "completed" && bothWantAgain);

            const nameNode = c.other.username ? (
              <Link
                to="/app/u/$username"
                params={{ username: c.other.username }}
                className="truncate font-display text-lg font-semibold tracking-[-0.02em] text-baila-ink hover:underline"
              >
                {otherName}
              </Link>
            ) : (
              <p className="truncate font-display text-lg font-semibold tracking-[-0.02em] text-baila-ink">
                {otherName}
              </p>
            );

            return (
              <li key={c.request.id} className="animate-rise" style={{ animationDelay: `${i * 45}ms` }}>
                <Card className="overflow-hidden">
                  <div className="flex items-center gap-3.5 p-3.5">
                    <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl bg-baila-ink shadow-soft">
                      {c.mainVideo ? (
                        <SignedImage
                          bucket="dance-videos"
                          path={c.mainVideo.poster_url ?? c.mainVideo.storage_path}
                          alt={`${otherName} dance video`}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-baila-yellow-soft text-baila-ink/35">
                          <Music2 className="h-5 w-5" />
                        </div>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-md">
                          <Play className="h-3 w-3" fill="currentColor" />
                        </span>
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        {nameNode}
                        {c.other.dance_styles[0] && <Pill>{c.other.dance_styles[0]}</Pill>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-baila-ink/55">
                        {c.other.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.other.city}
                          </span>
                        )}
                        <StatusTag status={c.status} direction={c.direction} hasFutureDate={hasFutureDate} />
                        {c.status === "pending" && (
                          <ExpiresHint createdAt={c.request.created_at} />
                        )}
                      </div>
                    </div>

                    {c.status === "pending" && c.direction === "in" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => decline(c.request.id)}
                          aria-label="Pass"
                          className="press flex h-11 w-11 items-center justify-center rounded-full bg-baila-ink/[0.06] text-baila-ink/60"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => accept(c.request.id)}
                          aria-label="Match"
                          className="press flex h-11 w-11 items-center justify-center rounded-full bg-baila-green text-white shadow-soft"
                        >
                          <Check className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                    {(c.status === "accepted" || c.status === "declined" || c.status === "completed") && (
                      <button
                        onClick={() => toggleAgain(c)}
                        aria-label="Dance again"
                        aria-pressed={!!danceAgain}
                        className={`press flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold ${
                          danceAgain
                            ? "bg-gradient-baila text-baila-ink shadow-soft"
                            : "bg-baila-ink/[0.06] text-baila-ink/60"
                        }`}
                      >
                        <Star className="h-4 w-4" fill={danceAgain ? "currentColor" : "none"} />
                        Again
                      </button>
                    )}
                  </div>

                  {c.status === "completed" && (
                    <div className="border-t border-baila-ink/[0.06] px-4 py-3">
                      <p className="text-xs text-baila-ink/60">
                        Would you like to dance with {otherName} again?
                      </p>
                    </div>
                  )}

                  {c.status === "accepted" && hasPastDate && (
                    <div className="border-t border-baila-ink/[0.06] px-4 py-3">
                      <Button variant="secondary" size="sm" onClick={() => markCompleted(c.request.id)}>
                        <CalendarCheck className="h-3.5 w-3.5" /> Mark as completed
                      </Button>
                    </div>
                  )}

                  {canOpenPlanner && (
                    <>
                      <button
                        onClick={() => setExpanded(open ? null : c.request.id)}
                        className="press flex w-full items-center justify-between border-t border-baila-ink/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-baila-ink/55"
                        aria-expanded={open}
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {c.status === "completed" ? "Plan another dance" : "Plan your dance date"}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && user && (
                        <DanceDateSheet
                          request={c.request}
                          other={c.other}
                          userId={user.id}
                          existingDate={c.danceDate}
                          trustedContact={settings?.trusted_contact ?? null}
                          onSaved={() => {
                            invalidate();
                            setExpanded(null);
                          }}
                        />
                      )}
                    </>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}

function ExpiresHint({ createdAt }: { createdAt: string }) {
  const deadline = new Date(createdAt).getTime() + REQUEST_TTL_HOURS * 3_600_000;
  const hoursLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 3_600_000));
  return (
    <span className="flex items-center gap-1 text-baila-ink/40">
      <Clock className="h-2.5 w-2.5" /> Expires in {hoursLeft}h
    </span>
  );
}

function StatusTag({
  status,
  direction,
  hasFutureDate,
}: {
  status: ConnectionRequest["status"];
  direction: "in" | "out";
  hasFutureDate: boolean;
}) {
  if (status === "pending") {
    return direction === "out" ? (
      <Pill tone="muted">Awaiting reply</Pill>
    ) : (
      <Pill tone="soft">Wants to dance</Pill>
    );
  }
  if (status === "accepted") return hasFutureDate ? <Pill tone="success">Upcoming</Pill> : <Pill tone="success">Matched</Pill>;
  if (status === "completed") return <Pill tone="ink">Completed</Pill>;
  if (status === "expired") return <Pill tone="muted">Expired</Pill>;
  return <Pill tone="muted">Declined</Pill>;
}

function EmptyStateForTab({ tab }: { tab: TabKey }) {
  const copy = {
    received: {
      title: "No dance requests yet.",
      body: "Open Dance and ask someone to share a floor with you.",
    },
    sent: {
      title: "No dance requests yet.",
      body: "Requests you've sent out will show up here.",
    },
    matches: {
      title: "No matches yet",
      body: "When someone says yes, you'll plan your dance date right here.",
    },
    past: {
      title: "Nothing in the past",
      body: "Declined, expired and completed dances will show up here.",
    },
  }[tab];
  return <EmptyState icon={<Heart className="h-6 w-6" />} title={copy.title} body={copy.body} />;
}
