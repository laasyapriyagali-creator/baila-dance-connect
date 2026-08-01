import { Link } from "@tanstack/react-router";
import { Music2, Heart, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

const tabs = [
  { to: "/app/dance", label: "Dance", Icon: Music2 },
  { to: "/app/date", label: "Date", Icon: Heart, badge: true as const },
  { to: "/app/profile", label: "Profile", Icon: User },
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
      return (reqs.count ?? 0) + (notifs.count ?? 0);
    },
  });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-2"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
    >
      <ul className="grid w-full max-w-sm grid-cols-3 rounded-full border border-baila-ink/[0.07] bg-card/85 p-1.5 shadow-float backdrop-blur-xl">
        {tabs.map(({ to, label, Icon, ...rest }) => {
          const count = "badge" in rest && rest.badge && unseen ? unseen : 0;
          return (
            <li key={to}>
              <Link
                to={to}
                activeProps={{ "data-active": "true" } as never}
                className="press group flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-full py-2 text-baila-ink/45 data-[active=true]:text-baila-ink"
              >
                <span className="relative flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 group-data-[active=true]:bg-gradient-baila group-data-[active=true]:shadow-soft">
                  <Icon className="h-[18px] w-[18px] transition-transform duration-200 group-data-[active=true]:scale-110" strokeWidth={2.25} />
                  {count > 0 && (
                    <span
                      aria-label={`${count} unseen`}
                      className="animate-pop-in absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-baila-orange px-1 text-[10px] font-bold text-white shadow-soft"
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.08em]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
