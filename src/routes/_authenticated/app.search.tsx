import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search as SearchIcon,
  MapPin,
  Music2,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/baila/SignedMedia";
import {
  DANCE_STYLES,
  ROLE_LABEL,
  type DanceClass,
  type DanceEvent,
  type DanceVideo,
  type Profile,
} from "@/lib/baila-types";

export const Route = createFileRoute("/_authenticated/app/search")({
  component: SearchPage,
});

const TABS = ["Dancers", "Classes", "Events"] as const;
type Tab = (typeof TABS)[number];

function SearchPage() {
  const [tab, setTab] = useState<Tab>("Dancers");
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<string>("");

  const dancersQ = useQuery({
    enabled: tab === "Dancers",
    queryKey: ["search-dancers", query, style],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("*")
        .eq("onboarded", true)
        .order("updated_at", { ascending: false })
        .limit(60);
      if (query) q = q.or(`display_name.ilike.%${query}%,username.ilike.%${query}%,city.ilike.%${query}%`);
      if (style) q = q.contains("dance_styles", [style]);
      const { data } = await q;
      const profiles = (data ?? []) as Profile[];
      if (profiles.length === 0) return [] as { profile: Profile; main: DanceVideo | null }[];
      const ids = profiles.map((p) => p.id);
      const { data: vids } = await supabase
        .from("dance_videos")
        .select("*")
        .in("user_id", ids)
        .eq("is_main", true);
      const m = new Map((vids ?? []).map((v) => [v.user_id, v as DanceVideo]));
      return profiles.map((p) => ({ profile: p, main: m.get(p.id) ?? null }));
    },
  });

  const classesQ = useQuery({
    enabled: tab === "Classes",
    queryKey: ["search-classes", query, style],
    queryFn: async () => {
      let q = supabase.from("classes").select("*").order("created_at", { ascending: false }).limit(60);
      if (query) q = q.or(`title.ilike.%${query}%,city.ilike.%${query}%`);
      if (style) q = q.eq("style", style);
      const { data } = await q;
      return (data ?? []) as DanceClass[];
    },
  });

  const eventsQ = useQuery({
    enabled: tab === "Events",
    queryKey: ["search-events", query, style],
    queryFn: async () => {
      let q = supabase
        .from("events")
        .select("*")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(60);
      if (query) q = q.or(`title.ilike.%${query}%,city.ilike.%${query}%,venue.ilike.%${query}%`);
      if (style) q = q.eq("style", style);
      const { data } = await q;
      return (data ?? []) as DanceEvent[];
    },
  });

  const loading =
    (tab === "Dancers" && dancersQ.isLoading) ||
    (tab === "Classes" && classesQ.isLoading) ||
    (tab === "Events" && eventsQ.isLoading);

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-3xl font-semibold text-baila-ink">Search</h1>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-baila-ink/10 bg-white px-4 py-2.5">
        <SearchIcon className="h-4 w-4 text-baila-ink/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, city, or vibe"
          className="flex-1 bg-transparent text-sm focus:outline-none"
          aria-label="Search"
        />
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t ? "bg-baila-ink text-baila-cream" : "bg-baila-ink/5 text-baila-ink/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setStyle("")}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            style === "" ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/60"
          }`}
        >
          All styles
        </button>
        {DANCE_STYLES.map((s) => (
          <button
            key={s}
            onClick={() => setStyle(style === s ? "" : s)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              style === s ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/60"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <ul className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="h-40 animate-pulse rounded-2xl bg-baila-ink/5" />
            ))}
          </ul>
        ) : tab === "Dancers" ? (
          <DancersGrid results={dancersQ.data ?? []} />
        ) : tab === "Classes" ? (
          <ClassesList results={classesQ.data ?? []} />
        ) : (
          <EventsList results={eventsQ.data ?? []} />
        )}
      </div>
    </div>
  );
}

function EmptyResult({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-baila-ink/15 bg-white px-6 py-12 text-center text-sm text-baila-ink/55">
      {label}
    </div>
  );
}

function DancersGrid({ results }: { results: { profile: Profile; main: DanceVideo | null }[] }) {
  if (results.length === 0) return <EmptyResult label="No dancers match yet. Try another style." />;
  return (
    <ul className="grid grid-cols-2 gap-3">
      {results.map(({ profile, main }) => (
        <li key={profile.id}>
          <Link
            to="/app/u/$username"
            params={{ username: profile.username ?? profile.id }}
            className="block overflow-hidden rounded-2xl bg-baila-ink"
            style={{ aspectRatio: "3 / 4" }}
          >
            <div className="relative h-full w-full">
              {main ? (
                <SignedImage
                  bucket="dance-videos"
                  path={main.poster_url ?? main.storage_path}
                  alt={profile.display_name ?? "Dancer"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-baila-yellow-soft text-baila-ink/50">
                  <Music2 className="h-7 w-7" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="truncate font-display text-base font-semibold leading-tight">
                  {profile.display_name ?? profile.username ?? "Dancer"}
                </p>
                <p className="truncate text-[11px] opacity-85">
                  {ROLE_LABEL[profile.role]}
                  {profile.city ? ` · ${profile.city}` : ""}
                </p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ClassesList({ results }: { results: DanceClass[] }) {
  if (results.length === 0) return <EmptyResult label="No classes published yet." />;
  return (
    <ul className="space-y-2">
      {results.map((c) => (
        <li key={c.id} className="rounded-2xl border border-baila-ink/10 bg-white p-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-yellow text-baila-ink">
              <GraduationCap className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-baila-ink">{c.title}</p>
              <p className="text-xs text-baila-ink/65">
                {c.style} · {c.level}
                {c.city && <span className="ml-1"><MapPin className="-mt-0.5 inline h-3 w-3" /> {c.city}</span>}
              </p>
              {c.recurrence && <p className="mt-1 text-xs text-baila-ink/55">{c.recurrence}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EventsList({ results }: { results: DanceEvent[] }) {
  if (results.length === 0) return <EmptyResult label="No upcoming events. Check back soon." />;
  return (
    <ul className="space-y-2">
      {results.map((e) => (
        <li key={e.id} className="rounded-2xl border border-baila-ink/10 bg-white p-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-yellow text-baila-ink">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-baila-ink">{e.title}</p>
              <p className="text-xs text-baila-ink/65">
                {new Date(e.starts_at).toLocaleString()}
                {e.venue && ` · ${e.venue}`}
              </p>
              {e.style && <p className="mt-1 text-xs text-baila-ink/55">{e.style}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
