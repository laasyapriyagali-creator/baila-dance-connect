import { forwardRef } from "react";
import { useReelUrl } from "@/lib/use-baila";
import type { Reel } from "@/lib/baila-local";

type Props = {
  reel: Reel;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
};

export const ReelVideo = forwardRef<HTMLVideoElement, Props>(function ReelVideo(
  { reel, className, autoPlay, loop = true, muted = true, controls },
  ref,
) {
  const url = useReelUrl(reel.id);

  if (!url) {
    return (
      <div className={className} style={{ backgroundColor: "var(--baila-ink)" }}>
        {reel.poster && (
          <img src={reel.poster} alt="" className="h-full w-full object-cover opacity-70" />
        )}
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={url}
      poster={reel.poster ?? undefined}
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline
      preload="metadata"
    />
  );
});
