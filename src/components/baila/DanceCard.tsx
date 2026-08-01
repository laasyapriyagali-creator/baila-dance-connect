import { MapPin, Play, GraduationCap, CalendarDays, Volume2, VolumeX, Music2 } from "lucide-react";
import { forwardRef, memo, useRef, useState } from "react";
import { SignedVideo } from "@/components/baila/SignedMedia";
import type { Profile, DanceVideo } from "@/lib/baila-types";
import { ROLE_LABEL } from "@/lib/baila-types";

export type FeedItem = { profile: Profile; mainVideo: DanceVideo };

type Props = {
  item: FeedItem;
  active: boolean;
  preload: boolean;
  onDoubleTap?: () => void;
};

export const DanceCard = memo(
  forwardRef<HTMLVideoElement, Props>(function DanceCard(
    { item, active, preload, onDoubleTap },
    videoRef,
  ) {
    const { profile, mainVideo } = item;
    const [muted, setMuted] = useState(true);
    const lastTap = useRef(0);

    const handleTap = () => {
      const now = Date.now();
      if (now - lastTap.current < 280) {
        onDoubleTap?.();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
        setMuted((m) => !m);
      }
    };

    const RoleIcon =
      profile.role === "instructor" ? GraduationCap : profile.role === "organizer" ? CalendarDays : null;

    return (
      <div
        className={`relative h-full w-full overflow-hidden rounded-[2rem] bg-gradient-ink shadow-float transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          active ? "scale-100 opacity-100" : "scale-[0.975] opacity-80"
        }`}
      >
        {/* Never a blank frame: shimmer sits under the video until it paints. */}
        <div aria-hidden className="shimmer absolute inset-0 rounded-[2rem] opacity-40" />
        <div aria-hidden className="absolute inset-0 flex items-center justify-center text-white/15">
          <Music2 className="h-10 w-10" />
        </div>

        <SignedVideo
          ref={videoRef}
          bucket="dance-videos"
          path={mainVideo.storage_path}
          posterBucket="dance-videos"
          posterPath={mainVideo.poster_url}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay={active}
          muted={muted}
          playsInline
          loop
          preload={active || preload ? "auto" : "none"}
          onClick={handleTap}
        />

        <div aria-hidden className="pointer-events-none absolute inset-0 bg-scrim" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-baila-ink/20 via-transparent to-baila-yellow/15"
        />

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md">
            <Play className="h-3 w-3" fill="currentColor" /> Dance
          </span>
          {RoleIcon && (
            <span className="bg-gradient-baila flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-baila-ink">
              <RoleIcon className="h-3 w-3" />
              {ROLE_LABEL[profile.role]}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => setMuted((m) => !m)}
          className="press absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white backdrop-blur-md"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 pb-6 pt-24">
          <div className="animate-rise min-w-0 text-white">
            <h2 className="truncate font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] drop-shadow-sm">
              {profile.display_name || profile.username || "Dancer"}
            </h2>
            {profile.headline && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80">{profile.headline}</p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-white/75">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.city}
                </span>
              )}
              {profile.years_dancing != null && profile.years_dancing > 0 && (
                <span>{profile.years_dancing}y dancing</span>
              )}
              {profile.experience && <span>{profile.experience}</span>}
            </div>
            {profile.dance_styles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.dance_styles.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }),
);
