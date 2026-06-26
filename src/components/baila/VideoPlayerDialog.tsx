import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { SignedVideo } from "@/components/baila/SignedMedia";
import { type DanceVideo } from "@/lib/baila-types";

type VideoPlayerDialogProps = {
  video: DanceVideo | null;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VideoPlayerDialog({ video, title, open, onOpenChange }: VideoPlayerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) videoRef.current?.pause();
  }, [open]);

  const playWhenReady = () => {
    const el = videoRef.current;
    if (!el) return;
    const play = el.play();
    if (play && typeof play.catch === "function") play.catch(() => undefined);
  };

  if (!open || !video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Dance video player"}
      onClick={() => onOpenChange(false)}
    >
      <button
        type="button"
        aria-label="Close video"
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="relative h-full max-h-[86dvh] w-full max-w-[520px] overflow-hidden rounded-3xl bg-black shadow-2xl"
        style={{ aspectRatio: "9 / 16" }}
        onClick={(event) => event.stopPropagation()}
      >
        <SignedVideo
          ref={videoRef}
          bucket="dance-videos"
          path={video.storage_path}
          posterBucket="dance-videos"
          posterPath={video.poster_url}
          className="h-full w-full object-contain"
          autoPlay
          loop={false}
          muted={false}
          playsInline
          controls
          preload="auto"
          onLoadedMetadata={playWhenReady}
        />
      </div>
    </div>
  );
}