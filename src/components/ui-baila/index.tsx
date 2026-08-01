/**
 * Baila design primitives.
 * Presentation only — no business logic lives here.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------- Button ------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "ink" | "danger" | "glass";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-gradient-baila text-baila-ink shadow-soft hover:brightness-[1.03]",
  secondary: "bg-white text-baila-ink border border-baila-ink/10 shadow-soft hover:bg-baila-yellow-soft/60",
  ghost: "bg-baila-ink/5 text-baila-ink/75 hover:bg-baila-ink/10",
  ink: "bg-baila-ink text-baila-cream shadow-soft hover:brightness-125",
  danger: "bg-destructive text-destructive-foreground shadow-soft",
  glass: "bg-white/15 text-white backdrop-blur-md border border-white/20",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
  }
>(function Button({ className, variant = "primary", size = "md", block, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "press inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.01em] outline-none",
        "focus-visible:ring-2 focus-visible:ring-baila-ink/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-55",
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
});

/** Circular icon button — used for floating feed actions and headers. */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: "sm" | "md" | "lg";
  }
>(function IconButton({ className, variant = "secondary", size = "md", ...props }, ref) {
  const dim = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-16 w-16" : "h-11 w-11";
  return (
    <button
      ref={ref}
      className={cn(
        "press inline-flex shrink-0 items-center justify-center rounded-full outline-none",
        "focus-visible:ring-2 focus-visible:ring-baila-ink/20",
        BUTTON_VARIANT[variant],
        dim,
        className,
      )}
      {...props}
    />
  );
});

/* -------------------------------- Card -------------------------------- */

export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-baila-ink/[0.07] bg-card shadow-soft",
        interactive && "press hover:shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function SectionCard({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-2.5", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-1">
          {title && (
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-baila-ink/45">{title}</h2>
          )}
          {action}
        </div>
      )}
      <Card className="overflow-hidden">{children}</Card>
    </section>
  );
}

/** Small metric tile. */
export function StatCard({
  value,
  label,
  icon,
  className,
}: {
  value: React.ReactNode;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col items-center gap-0.5 px-3 py-3.5", className)}>
      {icon && <span className="mb-0.5 text-baila-ink/45">{icon}</span>}
      <span className="font-display text-xl font-semibold leading-none text-baila-ink">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-baila-ink/45">{label}</span>
    </Card>
  );
}

/* ------------------------------- Inputs ------------------------------- */

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <span className="block px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-baila-ink/45">
          {label}
        </span>
      )}
      {children}
      {hint && <span className="block px-1 text-xs text-baila-ink/50">{hint}</span>}
    </div>
  );
}

const inputBase =
  "w-full rounded-2xl border border-baila-ink/10 bg-white px-4 py-3.5 text-[15px] text-baila-ink " +
  "placeholder:text-baila-ink/35 shadow-soft outline-none transition " +
  "focus:border-baila-yellow focus:ring-4 focus:ring-baila-yellow/25";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputBase, className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputBase, "resize-none leading-relaxed", className)} {...props} />;
});

export function Chip({
  active,
  tone = "blue",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  tone?: "blue" | "ink";
}) {
  const on = tone === "ink" ? "bg-baila-ink text-baila-cream shadow-soft" : "bg-gradient-baila text-baila-ink shadow-soft";
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "press rounded-full px-3.5 py-2 text-xs font-semibold tracking-[-0.01em]",
        active ? on : "bg-baila-ink/[0.055] text-baila-ink/65 hover:bg-baila-ink/10",
        className,
      )}
      {...props}
    />
  );
}

/** Read-only pill for metadata (styles, status, city). */
export function Pill({
  className,
  tone = "blue",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "blue" | "ink" | "soft" | "success" | "muted" }) {
  const tones = {
    blue: "bg-gradient-baila text-baila-ink",
    ink: "bg-baila-ink text-baila-cream",
    soft: "bg-baila-yellow-soft text-baila-ink",
    success: "bg-baila-green/15 text-baila-green",
    muted: "bg-baila-ink/[0.06] text-baila-ink/60",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------- Toggle ------------------------------- */

export function Toggle({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-baila-ink" : "bg-baila-ink/15",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

/* ---------------------------- Segmented tabs --------------------------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 rounded-full border border-baila-ink/[0.07] bg-white p-1 shadow-soft", className)}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={cn(
              "press flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold",
              active ? "bg-gradient-baila text-baila-ink shadow-soft" : "text-baila-ink/50 hover:text-baila-ink/75",
            )}
          >
            {o.label}
            {o.count ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold leading-4",
                  active ? "bg-baila-ink/10 text-baila-ink" : "bg-baila-ink/[0.07] text-baila-ink/55",
                )}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------- Loading states --------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-2xl", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-6 w-6 animate-spin rounded-full border-2 border-baila-ink/15 border-t-baila-ink",
        className,
      )}
    />
  );
}

/** Three bouncing bars — a dance-flavoured loader. */
export function DanceLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)} role="status">
      <span className="flex items-end gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-baila-yellow"
            style={{
              height: 24,
              animation: `baila-pop-in 600ms ${i * 110}ms cubic-bezier(0.22,1,0.36,1) infinite alternate`,
              transformOrigin: "bottom",
            }}
          />
        ))}
      </span>
      {label && <p className="text-sm font-medium text-baila-ink/55">{label}</p>}
    </div>
  );
}

/* ----------------------------- Empty state ----------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
  tone = "light",
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "animate-rise flex flex-col items-center gap-3 rounded-[2rem] px-7 py-12 text-center",
        dark ? "text-white" : "border border-baila-ink/[0.07] bg-card shadow-soft",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl",
            dark ? "bg-white/15 text-white backdrop-blur" : "bg-gradient-baila text-baila-ink shadow-glow",
          )}
        >
          {icon}
        </span>
      )}
      <h3 className={cn("font-display text-xl font-semibold", dark ? "text-white" : "text-baila-ink")}>{title}</h3>
      {body && (
        <p className={cn("max-w-xs text-sm leading-relaxed", dark ? "text-white/70" : "text-baila-ink/55")}>
          {body}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ------------------------------ Modal shell ---------------------------- */

/** Fade + slide bottom-sheet style modal used for confirmations. */
export function ModalSheet({
  open,
  onClose,
  children,
  label,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-baila-ink/50 p-4 backdrop-blur-sm duration-200 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "animate-sheet-up w-full max-w-md rounded-[2rem] border border-white/60 bg-card p-6 shadow-float",
          className,
        )}
        style={{ marginBottom: "max(env(safe-area-inset-bottom), 0px)" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------------------- Page transition -------------------------- */

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-baila-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-baila-ink/55">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Page({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("animate-rise px-5 pt-7", className)}>{children}</div>;
}
