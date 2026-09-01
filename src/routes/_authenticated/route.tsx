import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureGuestSession } from "@/lib/auth";
import { ensureGuestProfile } from "@/lib/guest.functions";

let provisioned = false;

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    let { data } = await supabase.auth.getUser();
    if (!data.user) {
      // No account yet — enter Baila as a guest instead of bouncing to /auth.
      await ensureGuestSession();
      data = (await supabase.auth.getUser()).data;
    }
    if (!data.user) throw redirect({ to: "/auth" });

    const isAnonymous = (data.user as { is_anonymous?: boolean }).is_anonymous === true;
    if (isAnonymous && !provisioned) {
      provisioned = true;
      try {
        await ensureGuestProfile();
      } catch {
        provisioned = false;
      }
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
