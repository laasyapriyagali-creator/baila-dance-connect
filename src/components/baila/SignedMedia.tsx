import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/storage";

export function SignedImage({
  bucket,
  path,
  alt,
  className,
  fallback,
}: {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
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
  return <img src={url} alt={alt} className={className} />;
}

export function SignedVideo({
  bucket,
  path,
  poster,
  className,
  autoPlay,
  loop = true,
  muted = true,
  playsInline = true,
  controls = false,
}: {
  bucket: string;
  path: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signedUrl(bucket, path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [bucket, path]);
  if (!url) return <div className={`${className ?? ""} animate-pulse bg-baila-ink/10`} />;
  return (
    <video
      src={url}
      poster={poster}
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      controls={controls}
    />
  );
}
