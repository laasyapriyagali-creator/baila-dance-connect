import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Film, HeartHandshake, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { fetchProfile } from "@/lib/baila-data";
import { Button, Card, EmptyState, Page, Skeleton, StatCard } from "@/components/ui-baila";

export const Route = createFileRoute("/_authenticated/app/settings/account")({
  head: () => ({
    meta: [
      { title: "Account information — Baila" },
      { name: "description", content: "Your login email, join date and account stats." },
      { property: "og:title", content: "Account information — Baila" },
      { property: "og:description", content: "Your login email, join date and account stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountInfoPage,
});

function AccountInfoPage() {
  const { user } = useSession();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: () => fetchProfile(user!.id),
  });

  const { data: counts } = useQuery({
    queryKey: ["account-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [videos, dances] = await Promise.all([
        supabase.from("dance_videos").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase
          .from("connection_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed")
          .or(`from_user.eq.${user!.id},to_user.eq.${user!.id}`),
      ]);
      return { videos: videos.count ?? 0, dances: dances.count ?? 0 };
    },
  });

  return (
    <Page className="pb-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/app/settings"
          aria-label="Back"
          className="press flex h-11 w-11 items-center justify-center rounded-full border border-baila-ink/10 bg-white text-baila-ink shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-[2rem] font-semibold tracking-[-0.03em] text-baila-ink">Account</h1>
      </div>

      {isLoading || !profile ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {isGuest && (
            <Card className="p-5">
              <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-baila-ink">
                ready to find your dance date?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-baila-ink/60">
                You're exploring Baila as a guest. Create an account to keep everything you've
                danced towards.
              </p>
              <Link to="/auth" className="mt-4 inline-block">
                <Button variant="primary">Create my account</Button>
              </Link>
            </Card>
          )}

          <Card className="divide-y divide-baila-ink/[0.06] overflow-hidden">
            <div className="px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-baila-ink/40">Email</p>
              <p className="mt-1 text-[15px] font-semibold text-baila-ink">
                {user?.email ?? "Guest session — no email yet"}
              </p>
            </div>
            <div className="px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-baila-ink/40">Joined</p>
              <p className="mt-1 text-[15px] font-semibold text-baila-ink">
                {new Date(profile.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Film className="h-4 w-4" />} value={counts?.videos ?? 0} label="Videos" />
            <StatCard icon={<HeartHandshake className="h-4 w-4" />} value={counts?.dances ?? 0} label="Dances" />
          </div>

          <Link to="/app/profile">
            <Button block variant="secondary">
              <Pencil className="h-4 w-4" /> Edit profile
            </Button>
          </Link>
        </div>
      )}
    </Page>
  );
}
