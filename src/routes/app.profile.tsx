import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronRight,
  MoreVertical,
  Play,
  Plus,
  Settings,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useBaila } from "@/store/baila";
import { DANCE_STYLES } from "@/data/dancers";
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
      { name: "description", content: "Your dance videos and styles." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { videos, removeVideo, setMainVideo, moveVideo, styles, toggleStyle } = useBaila();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="pb-6">
      {/* Compact header */}
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80"
            alt="You"
            className="h-12 w-12 rounded-full object-cover ring-2 ring-baila-yellow"
          />
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Alex</p>
            <p className="text-xs text-baila-ink/60">26 · Madrid</p>
          </div>
        </div>
        <button
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-ink/5"
        >
          <Settings className="h-5 w-5 text-baila-ink" />
        </button>
      </header>

      {/* HERO: My Dance Videos */}
      <section className="mx-4 mt-5 rounded-[2rem] bg-baila-yellow p-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-none text-baila-ink">
              My Dance Videos
            </h2>
            <p className="mt-1.5 text-sm text-baila-ink/70">
              The way you move is your profile.
            </p>
          </div>
          <span className="text-xs font-bold text-baila-ink/60">{videos.length}/5</span>
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          disabled={videos.length >= 5}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-baila-ink py-4 text-baila-cream shadow-lg transition active:scale-[0.99] disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Upload Dance Video</span>
        </button>

        {videos.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-baila-cream/60 p-6 text-center text-sm text-baila-ink/70">
            Upload your first clip to go live in the dance feed.
          </p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {videos.map((v) => (
              <li
                key={v.id}
                className="group relative overflow-hidden rounded-2xl bg-baila-ink"
                style={{ aspectRatio: "3 / 4" }}
              >
                <img
                  src={v.poster}
                  alt={v.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                <div className="absolute left-2 top-2 flex items-center gap-1">
                  {v.isMain && (
                    <span className="flex items-center gap-1 rounded-full bg-baila-yellow px-2 py-0.5 text-[10px] font-bold text-baila-ink">
                      <Star className="h-3 w-3" fill="currentColor" /> Main
                    </span>
                  )}
                </div>
                <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {v.duration}
                </span>
                <button
                  aria-label="Preview"
                  className="absolute inset-0 flex items-center justify-center text-white/90"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                    <Play className="h-5 w-5" fill="currentColor" />
                  </span>
                </button>
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                  <p className="truncate text-xs font-semibold text-white">{v.title}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="Video menu"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
                      >
                        <MoreVertical className="h-4 w-4" />
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

      {/* Dance styles */}
      <section className="mt-6 px-5">
        <h3 className="font-display text-xl font-semibold text-baila-ink">Dance styles</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {DANCE_STYLES.map((s) => {
            const active = styles.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleStyle(s)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-baila-ink bg-baila-ink text-baila-cream"
                    : "border-baila-ink/15 bg-white text-baila-ink/70"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </section>

      {/* Basic info */}
      <section className="mt-6 px-5">
        <h3 className="font-display text-xl font-semibold text-baila-ink">About</h3>
        <dl className="mt-3 divide-y divide-baila-ink/10 rounded-2xl border border-baila-ink/10 bg-white">
          {[
            ["Age", "26"],
            ["City", "Madrid"],
            ["Gender", "Non-binary"],
            ["Interested in", "Open to all"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-baila-ink/60">{k}</dt>
              <dd className="text-sm font-semibold text-baila-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Settings */}
      <section className="mt-6 px-5">
        <h3 className="font-display text-xl font-semibold text-baila-ink">Settings</h3>
        <ul className="mt-3 divide-y divide-baila-ink/10 rounded-2xl border border-baila-ink/10 bg-white">
          {["Account", "Notifications", "Privacy", "Help"].map((label) => (
            <li key={label}>
              <button className="flex w-full items-center justify-between px-4 py-3.5 text-left">
                <span className="text-sm font-medium text-baila-ink">{label}</span>
                <ChevronRight className="h-4 w-4 text-baila-ink/40" />
              </button>
            </li>
          ))}
          <li>
            <Link
              to="/"
              className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-destructive"
            >
              Sign out
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Link>
          </li>
        </ul>
      </section>

      <UploadVideoDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
