import logoAsset from "@/assets/baila-logo.png.asset.json";

export function Logo({ className = "", size = 96 }: { className?: string; size?: number }) {
  return (
    <img
      src={logoAsset.url}
      alt="Baila"
      width={size}
      height={size}
      className={`rounded-3xl ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
