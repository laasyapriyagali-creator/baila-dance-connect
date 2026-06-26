import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  MoreVertical,
  Play,
  Plus,
  Settings,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  MapPin,
  Sparkles,
  Link as LinkIcon,
  Pencil,
} from "lucide-react";
import { useBaila } from "@/store/baila";
import { UploadVideoDialog } from "@/components/baila/UploadVideoDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Baila" },
      { name: "description", content: "Your identity and dance reel." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, styles, videos, removeVideo, setMainVideo, moveVideo } = useBaila();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="pb-8">
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden">
        <img src={profile.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-baila-cream" />
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
          <img
            src={profile.avatar}
            alt={profile.name}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-baila-cream"
          />
          <button className="mb-1 flex items-center gap-1.5 rounded-full border border-baila-ink/15 bg-white px-4 py-2 text-sm font-semibold text-baila-ink shadow-sm">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </div>

        <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-baila-ink">
          {profile.name}
        </h1>
        <p className="text-sm text-baila-ink/60">@{profile.username}</p>

        <p className="mt-3 text-[15px] leading-relaxed text-baila-ink/85">{profile.bio}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-baila-ink/70">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {profile.city}
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> {profile.experience}
          </span>
          {profile.socials.map((s) => (
            <a
              key={s.label}
              href={s.url}
              className="flex items-center gap-1 text-baila-ink/70 underline-offset-2 hover:underline"
            >
              <LinkIcon className="h-4 w-4" /> {s.label}
            </a>
          ))}
        </div>

        {/* Followers / videos / following */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-baila-ink/10 rounded-2xl border border-baila-ink/10 bg-white py-3 text-center">
          <Stat value={videos.length} label="Videos" />
          <Stat value={profile.followers} label="Followers" />
          <Stat value={profile.following} label="Following" />
        </div>

        {/* Styles */}
        <div className="mt-5 flex flex-wrap gap-2">
          {styles.map((s) => (
            <span
              key={s}
              className="rounded-full bg-baila-yellow px-3 py-1.5 text-xs font-bold text-baila-ink"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Dance reel — primary content */}
      <section className="mt-7 px-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold text-baila-ink">Dance reel</h2>
          <button
            onClick={() => setUploadOpen(true)}
            disabled={videos.length >= 9}
            className="flex items-center gap-1 rounded-full bg-baila-ink px-3.5 py-2 text-xs font-semibold text-baila-cream disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Upload
          </button>
        </div>

        {videos.length === 0 ? (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-baila-ink/20 bg-baila-yellow-soft p-10 text-baila-ink"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-semibold">Upload your first dance video</span>
          </button>
        ) : (
          <ul className="grid grid-cols-3 gap-1.5">
            {videos.map((v) => (
              <li
                key={v.id}
                className="group relative overflow-hidden rounded-lg bg-baila-ink"
                style={{ aspectRatio: "3 / 4" }}
              >
                <img
                  src={v.poster}
                  alt={v.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {v.isMain && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-baila-yellow px-1.5 py-0.5 text-[9px] font-bold text-baila-ink">
                    <Star className="h-2.5 w-2.5" fill="currentColor" /> Main
                  </span>
                )}
                <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  {v.duration}
                </span>
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
                      {!v.isMain && (
                        <DropdownMenuItem onClick={() => setMainVideo(v.id)}>
                          <Star className="mr-2 h-4 w-4" /> Set as main
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => moveVideo(v.id, -1)}>
                        <ArrowUp className="mr-2 h-4 w-4" /> Move up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveVideo(v.id, 1)}>
                        <ArrowDown className="mr-2 h-4 w-4" /> Move down
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => removeVideo(v.id)}
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

      <UploadVideoDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold text-baila-ink">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-baila-ink/55">{label}</p>
    </div>
  );
}
