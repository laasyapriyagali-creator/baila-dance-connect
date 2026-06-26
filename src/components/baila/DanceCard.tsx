import { MapPin, Play, GraduationCap, CalendarDays, Volume2, VolumeX } from "lucide-react";
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
      <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-baila-ink animate-in fade-in duration-300">
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-baila-ink/25 via-transparent to-baila-yellow/10"
        />

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <Play className="h-3 w-3" fill="currentColor" /> Dance
          </span>
          {RoleIcon && (
            <span className="flex items-center gap-1 rounded-full bg-baila-yellow px-2.5 py-1 text-[11px] font-bold text-baila-ink">
              <RoleIcon className="h-3 w-3" />
              {ROLE_LABEL[profile.role]}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => setMuted((m) => !m)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-5 pt-24">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 text-white">
              <h2 className="truncate font-display text-3xl font-semibold leading-none">
                {profile.display_name || profile.username || "Dancer"}
              </h2>
              {profile.headline && (
                <p className="mt-1.5 line-clamp-1 text-sm opacity-90">{profile.headline}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-sm opacity-90">
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.city}
                  </span>
                )}
                {profile.years_dancing != null && profile.years_dancing > 0 && (
                  <span>{profile.years_dancing}y dancing</span>
                )}
              </div>
            </div>
            {profile.dance_styles[0] && (
              <span className="rounded-full bg-baila-yellow px-3 py-1.5 text-xs font-bold text-baila-ink">
                {profile.dance_styles[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }),
);
