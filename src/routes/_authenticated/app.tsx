import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BottomTabs } from "@/components/baila/BottomTabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async ({ location, context }) => {
    if (location.pathname === "/app" || location.pathname === "/app/") {
      throw redirect({ to: "/app/dance" });
    }
    const user = (context as { user?: { id: string } }).user;
    if (!user) return;
    if (location.pathname === "/app/onboarding") return;
    const { data } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .maybeSingle();
    if (data && !data.onboarded) {
      throw redirect({ to: "/app/onboarding" });
    }
  },
  component: AppShell,
});

function AppShell() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-md bg-baila-cream pb-24">
      <Outlet />
      <BottomTabs />
    </div>
  );
}
