import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Bell, Sparkles, Heart, GraduationCap, CalendarDays } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import type { Notification } from "@/lib/baila-types";

export const Route = createFileRoute("/_authenticated/app/notifications")({
  component: NotificationsPage,
});

const KIND_META: Record<string, { Icon: typeof Bell; label: string; href: string }> = {
  connection_request: { Icon: Heart, label: "wants to dance with you", href: "/app/date" },
  connection_accepted: { Icon: Sparkles, label: "matched with you", href: "/app/date" },
  new_class: { Icon: GraduationCap, label: "posted a new class", href: "/app/dance" },
  new_event: { Icon: CalendarDays, label: "posted a new event", href: "/app/dance" },
};

function actorIdFromPayload(p: Record<string, unknown> | null | undefined): string | null {
  if (!p) return null;
  return (
    (p.actor_id as string) ||
    (p.from_user as string) ||
    (p.with_user as string) ||
    (p.instructor_id as string) ||
    (p.organizer_id as string) ||
    null
  );
}

function NotificationsPage() {
  const { user } = useSession();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as Notification[];
    },
  });

  const actorIds = useMemo(() => {
    const ids = new Set<string>();
    (data ?? []).forEach((n) => {
      const id = actorIdFromPayload(n.payload as Record<string, unknown>);
      if (id) ids.add(id);
    });
    return Array.from(ids);
  }, [data]);

  const { data: profilesMap } = useQuery({
    queryKey: ["notification-actors", actorIds.sort().join(",")],
    enabled: actorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", actorIds);
      const map: Record<string, { display_name: string | null; username: string | null }> = {};
      (data ?? []).forEach((p) => {
        map[p.id] = { display_name: p.display_name, username: p.username };
      });
      return map;
    },
  });

  useEffect(() => {
    if (!user || !data || data.length === 0) return;
    const unread = data.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length === 0) return;
    supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["unseen-counts"] });
        qc.invalidateQueries({ queryKey: ["notifications", user.id] });
      });
  }, [data, user, qc]);

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-baila-ink">Inbox</h1>
        <p className="mt-1 text-sm text-baila-ink/60">Dance requests and matches from your community.</p>
      </header>

      {isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-2xl bg-baila-ink/5" />
          ))}
        </ul>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-baila-ink/15 bg-white px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-baila-yellow">
            <Bell className="h-5 w-5 text-baila-ink" />
          </div>
          <p className="max-w-xs text-sm text-baila-ink/65">
            You're all caught up. New matches and community updates will land here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((n) => {
            const meta = KIND_META[n.kind] ?? { Icon: Bell, label: "sent you an update", href: "/app/dance" };
            const Icon = meta.Icon;
            const payload = (n.payload ?? {}) as Record<string, unknown>;
            const actorId = actorIdFromPayload(payload);
            const profile = actorId ? profilesMap?.[actorId] : undefined;
            const actorName =
              (payload.actor_name as string) ||
              profile?.display_name ||
              (profile?.username ? `@${profile.username}` : null) ||
              "Someone";
            const title = (payload.title as string) || null;
            return (
              <li key={n.id}>
                <Link
                  to={meta.href}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    n.read_at ? "border-baila-ink/10 bg-white" : "border-baila-yellow bg-baila-yellow-soft"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-yellow text-baila-ink">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="text-baila-ink">
                      <span className="font-semibold">{actorName}</span>{" "}
                      <span className="text-baila-ink/70">{meta.label}</span>
                      {title ? <span className="text-baila-ink/70">: {title}</span> : null}
                    </p>
                    <p className="text-xs text-baila-ink/55">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
