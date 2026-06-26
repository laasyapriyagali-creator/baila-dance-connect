import { forwardRef, useEffect, useRef, useState } from "react";
import { signedUrl } from "@/lib/storage";

export function SignedImage({
  bucket,
  path,
  alt,
  className,
  fallback,
  loading = "lazy",
}: {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  loading?: "eager" | "lazy";
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    signedUrl(bucket, path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [bucket, path]);
  if (!path) return <>{fallback ?? null}</>;
  if (!url) return <div className={`${className ?? ""} animate-pulse bg-baila-ink/10`} />;
  return <img src={url} alt={alt} className={className} loading={loading} decoding="async" />;
}

type SignedVideoProps = {
  bucket: string;
  path: string;
  posterBucket?: string;
  posterPath?: string | null;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  onClick?: () => void;
};

export const SignedVideo = forwardRef<HTMLVideoElement, SignedVideoProps>(function SignedVideo(
  {
    bucket,
    path,
    posterBucket,
    posterPath,
    className,
    autoPlay,
    loop = true,
    muted = true,
    playsInline = true,
    controls = false,
    preload = "metadata",
    onClick,
  },
  ref,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    let alive = true;
    signedUrl(bucket, path).then((u) => alive && setUrl(u));
    if (posterPath && posterBucket) {
      signedUrl(posterBucket, posterPath).then((u) => alive && setPoster(u));
    }
    return () => {
      alive = false;
    };
  }, [bucket, path, posterBucket, posterPath]);
  if (!url) return <div className={`${className ?? ""} animate-pulse bg-baila-ink/10`} />;
  return (
    <video
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node;
      }}
      src={url}
      poster={poster ?? undefined}
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      controls={controls}
      preload={preload}
      onClick={onClick}
    />
  );
});
