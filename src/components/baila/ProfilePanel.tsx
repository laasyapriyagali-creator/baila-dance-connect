import { useRef, useState } from "react";
import { Camera, Play, Plus, Trash2, Check, MapPin, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ReelVideo } from "@/components/baila/ReelVideo";
import { DANCE_STYLES, EXPERIENCES, bailaStore, type Experience, type Reel } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";

export function ProfilePanel({ onAddReel }: { onAddReel: () => void }) {
  const { profile, reels, dates, settings } = useBaila();
  const [editing, setEditing] = useState(false);
  const [playing, setPlaying] = useState<Reel | null>(null);
  const mine = profile.name
    ? reels.filter((r) => r.dancer.toLowerCase() === profile.name.toLowerCase())
    : reels;

  return (
    <div className="min-h-[100dvh] pb-28">
      <div className="relative h-28 bg-baila-yellow">
        <Link
          to="/settings"
          aria-label="Settings"
          className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-baila-ink/10 text-baila-ink backdrop-blur"
          style={{ top: "max(env(safe-area-inset-top), 0.75rem)" }}
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
      <div className="px-4">
        <div className="-mt-10 flex items-end gap-3">
          <Avatar />
          <div className="pb-1">
            <h1 className="font-display text-2xl font-semibold text-baila-ink">
              {profile.name || "Your name"}
            </h1>
            <p className="text-xs text-baila-ink/60">
              {profile.age && !settings.privacy.hideAge ? `${profile.age} · ` : ""}
              {profile.experience}
              {profile.city ? ` · ${profile.city}` : ""}
            </p>
          </div>
        </div>

        {settings.paused && (
          <p className="mt-3 rounded-2xl bg-baila-ink/5 px-4 py-2.5 text-xs font-semibold text-baila-ink/70">
            Your profile is paused — your reels are hidden from the feed.
          </p>
        )}


        {profile.bio && <p className="mt-3 text-sm text-baila-ink/75">{profile.bio}</p>}

        {profile.styles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.styles.map((s) => (
              <span key={s} className="rounded-full bg-baila-ink/5 px-3 py-1.5 text-xs font-semibold text-baila-ink/75">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 rounded-full bg-baila-ink py-3 text-sm font-semibold text-baila-cream"
          >
            Edit profile
          </button>
          <button
            onClick={onAddReel}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-baila-ink/10 text-baila-ink"
            aria-label="Add reel"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Stat label="Reels" value={mine.length} />
          <Stat label="Dance dates" value={dates.length} />
        </div>

        <h2 className="mt-6 font-display text-lg font-semibold text-baila-ink">Dance reel</h2>
        {mine.length === 0 ? (
          <button
            onClick={onAddReel}
            className="mt-3 flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-baila-ink/25 px-4 py-10 text-center"
          >
            <Play className="h-5 w-5 text-baila-ink/55" />
            <span className="text-sm font-semibold text-baila-ink">Add your first reel</span>
            <span className="text-xs text-baila-ink/55">Movement is your profile here.</span>
          </button>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {mine.map((r) => (
              <li key={r.id} className="relative">
                <button
                  onClick={() => setPlaying(r)}
                  className="relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-baila-ink"
                  aria-label={`Play ${r.style} reel`}
                >
                  {r.poster ? (
                    <img src={r.poster} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 backdrop-blur">
                      <Play className="h-4 w-4 text-white" />
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    bailaStore.removeReel(r.id);
                    toast.success("Reel deleted");
                  }}
                  aria-label="Delete reel"
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && <EditProfile onClose={() => setEditing(false)} />}
      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3"
          onClick={() => setPlaying(null)}
        >
          <div
            className="relative w-full max-w-[520px] overflow-hidden rounded-3xl bg-black"
            style={{ aspectRatio: "9 / 16" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ReelVideo reel={playing} autoPlay controls muted={false} className="h-full w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/70 px-4 py-3">
      <p className="font-display text-xl font-semibold text-baila-ink">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-baila-ink/55">{label}</p>
    </div>
  );
}

function Avatar() {
  const { profile } = useBaila();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <div className="h-20 w-20 overflow-hidden rounded-3xl border-4 border-baila-cream bg-baila-ink/10">
        {profile.avatar ? (
          <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <button
        onClick={() => ref.current?.click()}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-baila-ink text-baila-cream"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = Array.from(e.target.files ?? [])[0];
          e.target.value = "";
          if (!file) return;
          const fr = new FileReader();
          fr.onload = () => {
            if (typeof fr.result === "string") {
              bailaStore.saveProfile({ avatar: fr.result });
              toast.success("Photo updated");
            }
          };
          fr.readAsDataURL(file);
        }}
      />
    </div>
  );
}

function EditProfile({ onClose }: { onClose: () => void }) {
  const { profile } = useBaila();
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [bio, setBio] = useState(profile.bio);
  const [experience, setExperience] = useState<Experience>(profile.experience);
  const [styles, setStyles] = useState<string[]>(profile.styles);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-baila-cream p-5">
        <h2 className="font-display text-xl font-semibold text-baila-ink">Edit profile</h2>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-baila-ink/5 px-4 py-3 text-sm text-baila-ink outline-none"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">City</span>
          <div className="mt-1 flex items-center gap-2 rounded-2xl bg-baila-ink/5 px-4">
            <MapPin className="h-4 w-4 text-baila-ink/50" />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent py-3 text-sm text-baila-ink outline-none"
            />
          </div>
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl bg-baila-ink/5 px-4 py-3 text-sm text-baila-ink outline-none"
          />
        </label>

        <div className="mt-3">
          <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Experience</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPERIENCES.map((e) => (
              <button
                key={e}
                onClick={() => setExperience(e)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  experience === e ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/70"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Styles</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {DANCE_STYLES.map((s) => (
              <button
                key={s}
                onClick={() =>
                  setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  styles.includes(s) ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-baila-ink/10 py-3 text-sm font-semibold text-baila-ink"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              bailaStore.saveProfile({ name: name.trim(), city: city.trim(), bio: bio.trim(), experience, styles });
              toast.success("Profile saved");
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-baila-ink py-3 text-sm font-semibold text-baila-cream"
          >
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
