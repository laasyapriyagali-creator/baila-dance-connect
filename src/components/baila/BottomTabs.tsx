import { Link } from "@tanstack/react-router";
import { Music2, Sparkles, User } from "lucide-react";

const tabs = [
  { to: "/app/dance", label: "Dance", Icon: Music2 },
  { to: "/app/connections", label: "Connections", Icon: Sparkles },
  { to: "/app/profile", label: "Profile", Icon: User },
] as const;

export function BottomTabs() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-baila-ink/10 bg-baila-cream/95 backdrop-blur"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeProps={{ "data-active": "true" } as never}
              className="group flex flex-col items-center gap-1 py-3 text-baila-ink/50 data-[active=true]:text-baila-ink"
            >
              <span className="flex h-10 w-12 items-center justify-center rounded-full transition group-data-[active=true]:bg-baila-yellow">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="text-[11px] font-semibold tracking-wide">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
