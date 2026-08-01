import { forwardRef, useEffect, useRef, useState } from "react";
import { signedUrl } from "@/lib/storage";

export function SignedImage({
  bucket,
  path,
  alt,
  className,
  fallback,
  loading = "lazy",
  fetchPriority,
}: {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
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
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={() => setUrl(null)}
    />
  );
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
  onLoadedMetadata?: () => void;
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
    onLoadedMetadata,
  },
  ref,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);
  const localRef = useRef<HTMLVideoElement>(null);
  const retried = useRef(false);

  useEffect(() => {
    let alive = true;
    setErrored(false);
    retried.current = false;
    signedUrl(bucket, path).then((u) => alive && setUrl(u));
    if (posterPath && posterBucket) {
      signedUrl(posterBucket, posterPath).then((u) => alive && setPoster(u));
    } else {
      setPoster(null);
    }
    return () => {
      alive = false;
    };
  }, [bucket, path, posterBucket, posterPath]);

  const handleError = () => {
    if (retried.current) {
      setErrored(true);
      return;
    }
    retried.current = true;
    // Force-refresh: signed URL may have expired or briefly failed.
    signedUrl(bucket, path).then((u) => {
      if (!u) {
        setErrored(true);
        return;
      }
      setUrl(`${u}${u.includes("?") ? "&" : "?"}r=${Date.now()}`);
    });
  };

  if (errored) {
    return (
      <div
        className={`${className ?? ""} flex items-center justify-center bg-baila-ink/80 text-xs text-white/70`}
      >
        Video unavailable
      </div>
    );
  }
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
      onLoadedMetadata={onLoadedMetadata}
      onError={handleError}
    />
  );
});
