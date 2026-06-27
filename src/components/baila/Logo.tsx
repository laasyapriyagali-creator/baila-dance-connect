import logoAsset from "@/assets/baila-logo.png.asset.json";

export function Logo({ className = "", size = 96 }: { className?: string; size?: number }) {
  // Recolor the original yellow logo background to the pastel blue brand color
  // using a hue-rotate filter. Black mark stays black (filter does not affect pure black).
  return (
    <img
      src={logoAsset.url}
      alt="Baila"
      width={size}
      height={size}
      className={`rounded-3xl ${className}`}
      style={{
        width: size,
        height: size,
        filter: "hue-rotate(190deg) saturate(0.55) brightness(1.05)",
      }}
    />
  );
}
