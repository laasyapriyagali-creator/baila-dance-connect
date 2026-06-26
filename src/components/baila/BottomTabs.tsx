import { Link } from "@tanstack/react-router";
import { Music2, Sparkles, User, Search, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

const tabs = [
  { to: "/app/dance", label: "Dance", Icon: Music2 },
  { to: "/app/search", label: "Search", Icon: Search },
  { to: "/app/connections", label: "Connections", Icon: Sparkles, badge: "connections" as const },
  { to: "/app/notifications", label: "Inbox", Icon: Bell, badge: "notifications" as const },
  { to: "/app/profile", label: "You", Icon: User },
] as const;

export function BottomTabs() {
  const { user } = useSession();
  const { data: unseen } = useQuery({
    queryKey: ["unseen-counts", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const [reqs, notifs] = await Promise.all([
        supabase
          .from("connection_requests")
          .select("id", { count: "exact", head: true })
          .eq("to_user", user!.id)
          .eq("status", "pending")
          .is("seen_at", null),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .is("read_at", null),
      ]);
      return { connections: reqs.count ?? 0, notifications: notifs.count ?? 0 };
    },
  });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-baila-ink/10 bg-baila-cream/95 backdrop-blur"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ to, label, Icon, ...rest }) => {
          const count = "badge" in rest && rest.badge && unseen ? unseen[rest.badge] : 0;
          return (
            <li key={to}>
              <Link
                to={to}
                activeProps={{ "data-active": "true" } as never}
                className="group flex min-h-11 flex-col items-center gap-0.5 py-2.5 text-baila-ink/50 data-[active=true]:text-baila-ink"
              >
                <span className="relative flex h-9 w-11 items-center justify-center rounded-full transition group-data-[active=true]:bg-baila-yellow">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
                  {count > 0 && (
                    <span
                      aria-label={`${count} unseen`}
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-baila-orange px-1 text-[10px] font-bold text-white"
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
