import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function SettingsShell({
  title,
  backTo,
  intro,
  children,
}: {
  title: string;
  backTo: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-baila-cream pb-16">
      <header
        className="sticky top-0 z-30 flex items-center gap-2 border-b border-baila-ink/10 bg-baila-cream/95 px-3 pb-3 backdrop-blur"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <Link
          to={backTo}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-ink/5 text-baila-ink"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-semibold text-baila-ink">{title}</h1>
      </header>
      <div className="px-4 pt-4">
        {intro && <p className="mb-4 text-sm text-baila-ink/65">{intro}</p>}
        {children}
      </div>
    </main>
  );
}

export function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      {label && (
        <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-baila-ink/50">
          {label}
        </h2>
      )}
      <div className="divide-y divide-baila-ink/10 overflow-hidden rounded-3xl bg-white/70">
        {children}
      </div>
    </section>
  );
}

export function RowLink({
  to,
  label,
  hint,
  icon,
}: {
  to: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Link to={to} className="flex min-h-14 items-center gap-3 px-4 py-3">
      {icon && <span className="text-baila-ink/60">{icon}</span>}
      <span className="flex-1">
        <span className="block text-sm font-semibold text-baila-ink">{label}</span>
        {hint && <span className="block text-xs text-baila-ink/55">{hint}</span>}
      </span>
      <ChevronRight className="h-4 w-4 text-baila-ink/40" />
    </Link>
  );
}

export function RowButton({
  label,
  hint,
  icon,
  onClick,
  danger,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button onClick={onClick} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
      {icon && <span className={danger ? "text-red-600" : "text-baila-ink/60"}>{icon}</span>}
      <span className="flex-1">
        <span
          className={`block text-sm font-semibold ${danger ? "text-red-600" : "text-baila-ink"}`}
        >
          {label}
        </span>
        {hint && <span className="block text-xs text-baila-ink/55">{hint}</span>}
      </span>
    </button>
  );
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-3">
      <span className="flex-1">
        <span className="block text-sm font-semibold text-baila-ink">{label}</span>
        {hint && <span className="block text-xs text-baila-ink/55">{hint}</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-baila-ink" : "bg-baila-ink/15"
        } ${disabled ? "opacity-40" : ""}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-baila-cream transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SegmentRow<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="px-4 py-3">
      <span className="block text-sm font-semibold text-baila-ink">{label}</span>
      {hint && <span className="block text-xs text-baila-ink/55">{hint}</span>}
      <div className="mt-2 flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              value === o.value ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/70"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TextRow({
  label,
  hint,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="block px-4 py-3">
      <span className="block text-sm font-semibold text-baila-ink">{label}</span>
      {hint && <span className="block text-xs text-baila-ink/55">{hint}</span>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl bg-baila-ink/5 px-4 py-2.5 text-sm text-baila-ink outline-none"
      />
    </label>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-baila-ink">{label}</span>
        <span className="text-sm font-semibold text-baila-ink/60">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-baila-ink"
      />
    </div>
  );
}
