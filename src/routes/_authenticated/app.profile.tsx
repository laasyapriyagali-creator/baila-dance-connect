import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  MoreVertical,
  Play,
  Plus,
  Settings,
  Star,
  Trash2,
  MapPin,
  Sparkles,
  Link as LinkIcon,
  Pencil,
  Music2,
  ImagePlus,
  User as UserIcon,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { UploadVideoDialog } from "@/components/baila/UploadVideoDialog";
import { EditProfileDialog } from "@/components/baila/EditProfileDialog";
import { SignedImage } from "@/components/baila/SignedMedia";
import { VideoPlayerDialog } from "@/components/baila/VideoPlayerDialog";
import { type DanceVideo, type Profile } from "@/lib/baila-types";
import { Button, EmptyState, Pill, Skeleton, StatCard } from "@/components/ui-baila";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Baila" },
      { name: "description", content: "Your identity and dance reel on Baila." },
      { property: "og:title", content: "Profile — Baila" },
      { property: "og:description", content: "Your identity and dance reel on Baila." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<DanceVideo | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const { data: videos } = useQuery({
    queryKey: ["my-videos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dance_videos")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_main", { ascending: false })
        .order("position", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DanceVideo[];
    },
  });

  // Onboarding flow handles initial profile setup at /app/onboarding.

  const removeVideo = async (v: DanceVideo) => {
    await supabase.storage.from("dance-videos").remove([v.storage_path]);
    const { error } = await supabase.from("dance_videos").delete().eq("id", v.id);
    if (error) toast.error(error.message);
    else {
      if (v.is_main) {
        const { data: rest } = await supabase
          .from("dance_videos")
          .select("id")
          .eq("user_id", user!.id)
          .limit(1);
        if (rest && rest[0]) {
          await supabase.from("dance_videos").update({ is_main: true }).eq("id", rest[0].id);
        }
      }
      qc.invalidateQueries({ queryKey: ["my-videos", user!.id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    }
  };

  const setMain = async (v: DanceVideo) => {
    const { error } = await supabase
      .from("dance_videos")
      .update({ is_main: true })
      .eq("id", v.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["my-videos", user!.id] });
  };

  const uploadImage = async (
    bucket: "avatars" | "covers",
    field: "avatar_url" | "cover_url",
    file: File,
  ) => {
    if (!user) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return toast.error(upErr.message);
    if (profile?.[field]) {
      await supabase.storage.from(bucket).remove([profile[field] as string]);
    }
    const { error } = await supabase
      .from("profiles")
      .update(field === "avatar_url" ? { avatar_url: path } : { cover_url: path })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  if (!profile) {
    return (
      <div className="pb-8">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="-mt-14 space-y-4 px-5">
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="h-4 w-28 rounded-full" />
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const name = profile.display_name || profile.username || "Your name";

  return (
    <div className="animate-rise pb-8">
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) uploadImage("covers", "cover_url", f);
        }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) uploadImage("avatars", "avatar_url", f);
        }}
      />

      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden">
        {profile.cover_url ? (
          <SignedImage
            bucket="covers"
            path={profile.cover_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="bg-gradient-baila absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-baila-ink/10 via-transparent to-background" />
        <button
          onClick={() => coverInputRef.current?.click()}
          aria-label="Change cover"
          className="press absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-baila-ink shadow-soft backdrop-blur"
          style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
        >
          <ImagePlus className="h-[18px] w-[18px]" />
        </button>
        <Link
          to="/app/settings"
          aria-label="Settings"
          className="press absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-baila-ink shadow-soft backdrop-blur"
          style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </div>

      {/* Identity */}
      <section className="-mt-14 px-5">
        <div className="flex items-end justify-between gap-3">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="press group relative h-28 w-28 overflow-hidden rounded-full ring-[5px] ring-background"
            aria-label="Change avatar"
          >
            {profile.avatar_url ? (
              <SignedImage
                bucket="avatars"
                path={profile.avatar_url}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="bg-gradient-baila flex h-full w-full items-center justify-center text-baila-ink">
                <UserIcon className="h-10 w-10" />
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-center bg-baila-ink/50 text-[10px] font-bold uppercase tracking-[0.1em] text-white opacity-0 transition-opacity group-hover:opacity-100">
              Change
            </span>
          </button>
          <Button variant="secondary" size="sm" className="mb-2 h-10" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit profile
          </Button>
        </div>

        <h1 className="mt-4 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-baila-ink">
          {name}
        </h1>
        {profile.username && <p className="mt-0.5 text-sm text-baila-ink/50">@{profile.username}</p>}
        {profile.headline && (
          <p className="mt-2 text-[15px] font-medium leading-snug text-baila-ink/80">{profile.headline}</p>
        )}

        {profile.bio ? (
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-baila-ink/75">
            {profile.bio}
          </p>
        ) : (
          <button
            onClick={() => setEditOpen(true)}
            className="mt-3 text-sm font-medium text-baila-ink/45 underline underline-offset-4"
          >
            Add a short bio
          </button>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-baila-ink/60">
          {profile.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {profile.city}
            </span>
          )}
          {profile.experience && (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> {profile.experience}
            </span>
          )}
          {profile.socials.map((s) => (
            <a
              key={s.label + s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-medium text-baila-ink/70 underline-offset-4 hover:underline"
            >
              <LinkIcon className="h-4 w-4" /> {s.label}
            </a>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <StatCard value={videos?.length ?? 0} label="Dances" icon={<Film className="h-4 w-4" />} />
          <StatCard
            value={profile.dance_styles.length}
            label="Styles"
            icon={<Music2 className="h-4 w-4" />}
          />
          <StatCard
            value={profile.years_dancing != null && profile.years_dancing > 0 ? `${profile.years_dancing}y` : "—"}
            label="Dancing"
            icon={<Sparkles className="h-4 w-4" />}
          />
        </div>

        {profile.dance_styles.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.dance_styles.map((s) => (
              <Pill key={s} className="px-3 py-1.5 text-[11px]">
                {s}
              </Pill>
            ))}
          </div>
        )}
      </section>

      {/* Reel */}
      <section className="mt-8 px-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-baila-ink">Dance reel</h2>
          <Button variant="ink" size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" /> Upload
          </Button>
        </div>

        {!videos || videos.length === 0 ? (
          <EmptyState
            icon={<Music2 className="h-6 w-6" />}
            title="Upload your first dance"
            body="Your reel is how others discover you on Baila — phone footage is perfect."
            action={
              <Button variant="primary" onClick={() => setUploadOpen(true)}>
                <Plus className="h-4 w-4" /> Upload a dance
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {videos.map((v, i) => (
              <li
                key={v.id}
                className="animate-pop-in group relative overflow-hidden rounded-2xl bg-baila-ink shadow-soft"
                style={{ aspectRatio: "3 / 4", animationDelay: `${i * 35}ms` }}
              >
                <button
                  type="button"
                  aria-label="Play dance video"
                  onClick={() => setPlayingVideo(v)}
                  className="absolute inset-0 text-left"
                >
                  <SignedImage
                    bucket="dance-videos"
                    path={v.poster_url ?? v.storage_path}
                    alt="Dance video"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    fallback={
                      <div className="shimmer absolute inset-0 flex items-center justify-center text-baila-cream/60">
                        <Music2 className="h-6 w-6" />
                      </div>
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-baila-ink/60 via-transparent to-transparent" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-md transition-transform duration-200 group-hover:scale-110">
                      <Play className="h-4 w-4" fill="currentColor" />
                    </span>
                  </span>
                </button>
                {v.is_main && (
                  <span className="bg-gradient-baila absolute left-2 top-2 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-baila-ink shadow-soft">
                    <Star className="h-2.5 w-2.5" fill="currentColor" /> Main
                  </span>
                )}
                {v.duration_seconds != null && (
                  <span className="absolute right-2 top-2 rounded-full bg-baila-ink/55 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur">
                    0:{String(v.duration_seconds).padStart(2, "0")}
                  </span>
                )}
                <div className="absolute bottom-1.5 right-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="Video menu"
                        className="press flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white backdrop-blur-md"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-baila-ink/10 shadow-card">
                      {!v.is_main && (
                        <DropdownMenuItem onClick={() => setMain(v)}>
                          <Star className="mr-2 h-4 w-4" /> Set as main
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => removeVideo(v)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {user && (
        <UploadVideoDialog userId={user.id} open={uploadOpen} onOpenChange={setUploadOpen} />
      )}
      {profile && (
        <EditProfileDialog
          profile={profile}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
      <VideoPlayerDialog
        video={playingVideo}
        title="Your dance video"
        open={!!playingVideo}
        onOpenChange={(open) => !open && setPlayingVideo(null)}
      />
    </div>
  );
}
