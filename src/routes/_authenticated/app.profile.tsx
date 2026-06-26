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
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { UploadVideoDialog } from "@/components/baila/UploadVideoDialog";
import { EditProfileDialog } from "@/components/baila/EditProfileDialog";
import { SignedImage } from "@/components/baila/SignedMedia";
import { ManageContent } from "@/components/baila/ManageContent";
import { ROLE_LABEL, type DanceVideo, type Profile } from "@/lib/baila-types";
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
      { name: "description", content: "Your identity and dance reel." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
      <div className="space-y-4 p-5">
        <div className="h-44 animate-pulse rounded-2xl bg-baila-ink/5" />
        <div className="h-24 w-24 animate-pulse rounded-full bg-baila-ink/5" />
        <div className="h-4 w-40 animate-pulse rounded bg-baila-ink/5" />
      </div>
    );
  }

  const name = profile.display_name || profile.username || "Your name";

  return (
    <div className="pb-8">
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
      <div className="relative h-44 w-full overflow-hidden bg-baila-yellow-soft">
        {profile.cover_url ? (
          <SignedImage
            bucket="covers"
            path={profile.cover_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-baila-yellow to-baila-yellow-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-baila-cream" />
        <button
          onClick={() => coverInputRef.current?.click()}
          aria-label="Change cover"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-baila-ink shadow-sm backdrop-blur"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <Link
          to="/app/settings"
          aria-label="Settings"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-baila-ink shadow-sm backdrop-blur"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Identity */}
      <section className="-mt-12 px-5">
        <div className="flex items-end justify-between">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="group relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-baila-cream"
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
              <div className="flex h-full w-full items-center justify-center bg-baila-yellow text-baila-ink">
                <UserIcon className="h-9 w-9" />
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-black/45 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
              Change
            </span>
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="mb-1 flex items-center gap-1.5 rounded-full border border-baila-ink/15 bg-white px-4 py-2 text-sm font-semibold text-baila-ink shadow-sm"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold leading-tight text-baila-ink">{name}</h1>
          <span className="rounded-full bg-baila-ink/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-baila-ink/70">
            {ROLE_LABEL[profile.role]}
          </span>
        </div>
        {profile.username && <p className="text-sm text-baila-ink/60">@{profile.username}</p>}
        {profile.headline && (
          <p className="mt-1 text-[15px] font-medium text-baila-ink/85">{profile.headline}</p>
        )}

        {profile.bio ? (
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-baila-ink/85">
            {profile.bio}
          </p>
        ) : (
          <button
            onClick={() => setEditOpen(true)}
            className="mt-3 text-sm text-baila-ink/50 underline-offset-2 hover:underline"
          >
            Add a short bio
          </button>
        )}

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
          {profile.socials.map((s) => (
            <a
              key={s.label + s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-baila-ink/70 underline-offset-2 hover:underline"
            >
              <LinkIcon className="h-4 w-4" /> {s.label}
            </a>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-baila-ink/10 bg-white py-3 text-center">
          <p className="font-display text-lg font-semibold text-baila-ink">
            {videos?.length ?? 0}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-baila-ink/55">
            Dance videos
          </p>
        </div>

        {profile.dance_styles.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.dance_styles.map((s) => (
              <span
                key={s}
                className="rounded-full bg-baila-yellow px-3 py-1.5 text-xs font-bold text-baila-ink"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Reel */}
      <section className="mt-7 px-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold text-baila-ink">Dance reel</h2>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1 rounded-full bg-baila-ink px-3.5 py-2 text-xs font-semibold text-baila-cream"
          >
            <Plus className="h-4 w-4" /> Upload
          </button>
        </div>

        {!videos || videos.length === 0 ? (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-baila-ink/20 bg-baila-yellow-soft p-10 text-baila-ink"
          >
            <Music2 className="h-7 w-7" />
            <span className="text-sm font-semibold">Upload your first dance</span>
            <span className="text-xs text-baila-ink/60">
              Your reel is how others discover you on Baila
            </span>
          </button>
        ) : (
          <ul className="grid grid-cols-3 gap-1.5">
            {videos.map((v) => (
              <li
                key={v.id}
                className="group relative overflow-hidden rounded-lg bg-baila-ink"
                style={{ aspectRatio: "3 / 4" }}
              >
                <SignedImage
                  bucket="dance-videos"
                  path={v.poster_url ?? v.storage_path}
                  alt="Dance video"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                {v.is_main && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-baila-yellow px-1.5 py-0.5 text-[9px] font-bold text-baila-ink">
                    <Star className="h-2.5 w-2.5" fill="currentColor" /> Main
                  </span>
                )}
                {v.duration_seconds != null && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    0:{String(v.duration_seconds).padStart(2, "0")}
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur">
                    <Play className="h-4 w-4" fill="currentColor" />
                  </span>
                </span>
                <div className="absolute bottom-1 right-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="Video menu"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl">
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

      {(profile.role === "instructor" || profile.role === "organizer") && user && (
        <ManageContent userId={user.id} role={profile.role} />
      )}

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
    </div>
  );
}
