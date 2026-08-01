import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  X,
  Star,
  MapPin,
  Play,
  Sparkles,
  Music2,
  CalendarPlus,
  Wand2,
  ChevronDown,
  Heart,
  Clock,
  Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/baila/SignedMedia";
import { useSession } from "@/lib/auth";
import { ICE_BREAKERS, type ConnectionRequest, type DanceVideo, type Profile } from "@/lib/baila-types";
import { buildIcs, downloadIcs } from "@/lib/ics";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Page,
  PageHeader,
  Pill,
  Segmented,
  Skeleton,
} from "@/components/ui-baila";

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
  { key: "requests", label: "Requests" },
  { key: "matches", label: "Matches" },
  { key: "past", label: "Past" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function DatePage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("requests");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["connections", user?.id],
    queryFn: () => fetchConnections(user!.id),
    enabled: !!user,
  });

  const items = data ?? [];
  const grouped: Record<TabKey, EnrichedConnection[]> = useMemo(
    () => ({
      requests: items.filter((c) => c.request.status === "pending"),
      matches: items.filter((c) => c.request.status === "accepted"),
      past: items.filter((c) => c.request.status === "declined"),
    }),
    [items],
  );
  const visible = grouped[tab];

  useEffect(() => {
    if (!user || tab !== "requests") return;
    const unseen = grouped.requests
      .filter((c) => c.direction === "in" && !c.request.seen_at)
      .map((c) => c.request.id);
    if (unseen.length === 0) return;
    supabase
      .from("connection_requests")
      .update({ seen_at: new Date().toISOString() })
      .in("id", unseen)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["unseen-counts"] });
        qc.invalidateQueries({ queryKey: ["connections", user.id] });
      });
  }, [tab, grouped.requests, user, qc]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["connections", user?.id] });

  const accept = async (id: string) => {
    const { error } = await supabase.from("connection_requests").update({ status: "accepted" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("It's a match — plan your dance.");
      invalidate();
    }
  };
  const decline = async (id: string) => {
    const { error } = await supabase.from("connection_requests").update({ status: "declined" }).eq("id", id);
    if (error) toast.error(error.message);
    else invalidate();
  };
  const toggleAgain = async (c: EnrichedConnection) => {
    const userIsFrom = c.request.from_user === user?.id;
    const patch = userIsFrom ? { again_from: !c.request.again_from } : { again_to: !c.request.again_to };
    const { error } = await supabase.from("connection_requests").update(patch).eq("id", c.request.id);
    if (error) toast.error(error.message);
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
            const otherName = c.other.display_name || c.other.username || "Dancer";
            const open = expanded === c.request.id;
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
                        <p className="truncate font-display text-lg font-semibold tracking-[-0.02em] text-baila-ink">
                          {otherName}
                        </p>
                        {c.other.dance_styles[0] && <Pill>{c.other.dance_styles[0]}</Pill>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-baila-ink/55">
                        {c.other.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.other.city}
                          </span>
                        )}
                        <StatusTag status={c.request.status} direction={c.direction} />
                      </div>
                    </div>

                    {c.request.status === "pending" && c.direction === "in" && (
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
                    {(c.request.status === "accepted" || c.request.status === "declined") && (
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

                  {c.request.status === "accepted" && (
                    <>
                      <button
                        onClick={() => setExpanded(open ? null : c.request.id)}
                        className="press flex w-full items-center justify-between border-t border-baila-ink/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-baila-ink/55"
                        aria-expanded={open}
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Plan your dance date
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && <MeetIRLPanel c={c} />}
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

function StatusTag({
  status,
  direction,
}: {
  status: ConnectionRequest["status"];
  direction: "in" | "out";
}) {
  if (status === "pending") {
    return direction === "out" ? (
      <Pill tone="muted">
        <Clock className="h-2.5 w-2.5" /> Awaiting reply
      </Pill>
    ) : (
      <Pill tone="soft">Wants to dance</Pill>
    );
  }
  if (status === "accepted") return <Pill tone="success">Matched</Pill>;
  return <Pill tone="muted">Passed</Pill>;
}

const SPOT_IDEAS = [
  { title: "A social night", body: "Live DJ, open floor, zero pressure." },
  { title: "A studio class", body: "Learn something new together." },
  { title: "An outdoor session", body: "Park, plaza or rooftop — bring a speaker." },
];

function MeetIRLPanel({ c }: { c: EnrichedConnection }) {
  const otherName = c.other.display_name || c.other.username || "your dance partner";
  const sharedStyles = useMemo(() => c.other.dance_styles ?? [], [c.other.dance_styles]);
  const [iceBreaker, setIceBreaker] = useState(
    () => ICE_BREAKERS[Math.floor(Math.random() * ICE_BREAKERS.length)],
  );
  const [when, setWhen] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(19, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [where, setWhere] = useState("");

  const exportIcs = () => {
    const start = new Date(when);
    if (Number.isNaN(start.getTime())) return toast.error("Pick a valid date and time");
    const ics = buildIcs({
      title: `Dance date with ${otherName}`,
      description: `Style: ${sharedStyles[0] ?? "your call"}\nIce-breaker: ${iceBreaker}`,
      location: where || c.other.city || "",
      start,
      durationMinutes: 60,
    });
    downloadIcs(`baila-${otherName.toLowerCase().replace(/\s+/g, "-")}`, ics);
    toast.success("Calendar invite ready");
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
        {SPOT_IDEAS.map((s) => (
          <button
            key={s.title}
            onClick={() => setWhere(s.title)}
            className={`press w-40 shrink-0 rounded-2xl border p-3 text-left shadow-soft ${
              where === s.title ? "border-baila-yellow bg-white" : "border-white/70 bg-white/85"
            }`}
          >
            <p className="font-display text-sm font-semibold text-baila-ink">{s.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-baila-ink/55">{s.body}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        <Field label="When">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="py-3" />
        </Field>
        <Field label="Where">
          <Input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder={c.other.city ? `Studio or social in ${c.other.city}` : "Studio or social"}
            className="py-3"
          />
        </Field>
      </div>

      <Button variant="ink" block className="mt-4 h-12" onClick={exportIcs}>
        <CalendarPlus className="h-4 w-4" /> Add to calendar
      </Button>
      <p className="mt-2.5 text-center text-[11px] text-baila-ink/50">
        No chat needed — show up, dance, see what happens.
      </p>
    </div>
  );
}

function EmptyStateForTab({ tab }: { tab: TabKey }) {
  const copy = {
    requests: {
      title: "No dance requests yet",
      body: "Open Dance and ask someone to share a floor with you.",
    },
    matches: {
      title: "No matches yet",
      body: "When someone says yes, you'll plan your dance date right here.",
    },
    past: {
      title: "Nothing in the past",
      body: "Dancers you've passed on will show up here.",
    },
  }[tab];
  return <EmptyState icon={<Heart className="h-6 w-6" />} title={copy.title} body={copy.body} />;
}
