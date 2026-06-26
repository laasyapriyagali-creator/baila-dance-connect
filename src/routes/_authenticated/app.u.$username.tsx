import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Music2, Play, Sparkles, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/baila/SignedMedia";
import { type DanceVideo, type Profile } from "@/lib/baila-types";

export const Route = createFileRoute("/_authenticated/app/u/$username")({
  component: PublicProfile,
});

function PublicProfile() {
  const { username } = useParams({ from: "/_authenticated/app/u/$username" });

  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      // Allow lookup by username or by id fallback.
      const { data: byU } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      let profile = byU as Profile | null;
      if (!profile) {
        const { data: byId } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", username)
          .maybeSingle();
        profile = (byId as Profile | null) ?? null;
      }
      if (!profile) return null;
      const { data: vids } = await supabase
        .from("dance_videos")
        .select("*")
        .eq("user_id", profile.id)
        .order("is_main", { ascending: false })
        .order("created_at", { ascending: false });
      return { profile, videos: (vids ?? []) as DanceVideo[] };
    },
  });

  if (isLoading) return <div className="p-6 text-baila-ink/60">Loading…</div>;
  if (!data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-2xl">Dancer not found</p>
        <Link to="/app/dance" className="text-sm font-semibold underline">
          Back to Dance
        </Link>
      </div>
    );
  }
  const { profile, videos } = data;
  const name = profile.display_name || profile.username || "Dancer";

  return (
    <div className="pb-8">
      <div className="relative h-44 w-full overflow-hidden bg-baila-yellow-soft">
        {profile.cover_url ? (
          <SignedImage bucket="covers" path={profile.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-baila-yellow to-baila-yellow-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-baila-cream" />
        <Link
          to="/app/dance"
          aria-label="Back"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-baila-ink shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <section className="-mt-12 px-5">
        <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-baila-cream">
          {profile.avatar_url ? (
            <SignedImage bucket="avatars" path={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-baila-yellow">
              <UserIcon className="h-9 w-9 text-baila-ink" />
            </div>
          )}
        </div>
        <div className="mt-3">
          <h1 className="font-display text-2xl font-semibold text-baila-ink">{name}</h1>
        </div>
        {profile.username && <p className="text-sm text-baila-ink/60">@{profile.username}</p>}
        {profile.headline && <p className="mt-1 text-[15px] font-medium text-baila-ink/85">{profile.headline}</p>}
        {profile.bio && <p className="mt-3 whitespace-pre-line text-[15px] text-baila-ink/85">{profile.bio}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-baila-ink/70">
          {profile.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {profile.city}
            </span>
          )}
          {profile.experience && (
            <span className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> {profile.experience}
            </span>
          )}
        </div>
        {profile.dance_styles.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.dance_styles.map((s) => (
              <span key={s} className="rounded-full bg-baila-yellow px-3 py-1.5 text-xs font-bold text-baila-ink">
                {s}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="mt-7 px-5">
        <h2 className="mb-3 font-display text-xl font-semibold text-baila-ink">Dance reel</h2>
        {videos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-baila-ink/15 bg-white px-5 py-8 text-center text-sm text-baila-ink/55">
            No dance videos yet.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-1.5">
            {videos.map((v) => (
              <li key={v.id} className="relative overflow-hidden rounded-lg bg-baila-ink" style={{ aspectRatio: "3 / 4" }}>
                {v.poster_url ? (
                  <SignedImage bucket="dance-videos" path={v.poster_url} alt="Dance video" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-baila-cream/70">
                    <Music2 className="h-6 w-6" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur">
                    <Play className="h-4 w-4" fill="currentColor" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
