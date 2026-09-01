import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Clips already in the dance-videos bucket, reused for the demo experience. */
const CLIPS = [
  "b03a5fe5-b1da-4615-945f-6be62bdabca6/44d77619-6fa8-4fc4-972b-14fd884e3339.mp4",
  "8fe61007-91a2-48a5-b99b-e99bce2ed9de/26f05e8f-48ef-4058-a5f0-e787bbbc64eb.mp4",
  "5d3eb127-20d2-4766-8c97-a3438b4b82f8/28ab7bb1-67af-4237-ba5f-b46a9aac7e28.mp4",
];

/**
 * Provisions the guest visitor as a real Baila member ("Lily") the first time
 * their anonymous session appears: profile, dance reel, settings and a small
 * amount of connection history so Date/Profile read live data.
 */
export const ensureGuestProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const isAnonymous = (context.claims as { is_anonymous?: boolean } | null)?.is_anonymous === true;
    if (!isAnonymous) return { provisioned: false as const };

    const { data: existing } = await context.supabase
      .from("profiles")
      .select("id, onboarded")
      .eq("id", userId)
      .maybeSingle();
    if (existing?.onboarded) return { provisioned: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const suffix = userId.slice(0, 5);

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      username: `lily.${suffix}`,
      display_name: "Lily",
      headline: "Salsa nights, kizomba mornings.",
      bio: "Two left feet on Mondays, unstoppable by Friday. Find me where the music is loud.",
      city: "Lisbon",
      age: 26,
      experience: "intermediate",
      favorite_style: "Bachata",
      dance_styles: ["Salsa", "Bachata", "Kizomba"],
      languages: ["English", "Portuguese"],
      availability: ["Weeknights", "Weekends"],
      years_dancing: 3,
      avatar_url: "demo/lily.jpg",
      cover_url: "demo/lily-cover.jpg",
      onboarded: true,
      is_guest: true,
    });

    await supabaseAdmin
      .from("user_settings")
      .upsert({ user_id: userId, discoverable: true }, { onConflict: "user_id" });

    const { data: myVideos } = await supabaseAdmin
      .from("dance_videos")
      .select("id")
      .eq("user_id", userId);
    if (!myVideos?.length) {
      await supabaseAdmin.from("dance_videos").insert(
        CLIPS.map((path, i) => ({
          user_id: userId,
          storage_path: path,
          video_url: path,
          position: i,
          is_main: i === 0,
        })),
      );
    }

    // History cast (never surfaced in discovery) + one dancer who already asked.
    const { data: cast } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .in("username", ["sofia.m", "diego.a", "tara.lin", "kenji.m"]);
    const byName = new Map((cast ?? []).map((c) => [c.username as string, c.id as string]));
    const sofia = byName.get("sofia.m");
    const diego = byName.get("diego.a");
    const tara = byName.get("tara.lin");
    const kenji = byName.get("kenji.m");

    const rows: Array<{ from_user: string; to_user: string; status: string }> = [];
    if (sofia) rows.push({ from_user: sofia, to_user: userId, status: "accepted" });
    if (diego) rows.push({ from_user: userId, to_user: diego, status: "accepted" });
    if (tara) rows.push({ from_user: userId, to_user: tara, status: "completed" });
    if (kenji) rows.push({ from_user: kenji, to_user: userId, status: "pending" });

    if (rows.length) {
      const { data: inserted } = await supabaseAdmin
        .from("connection_requests")
        .upsert(rows as never, { onConflict: "from_user,to_user" })
        .select("id, from_user, to_user, status");

      // One confirmed dance date so the IRL planner is populated from second one.
      const withSofia = (inserted ?? []).find((r) => r.from_user === sofia);
      if (withSofia) {
        const { data: hasDate } = await supabaseAdmin
          .from("dance_dates")
          .select("id")
          .eq("request_id", withSofia.id)
          .maybeSingle();
        if (!hasDate) {
          const starts = new Date(Date.now() + 3 * 86_400_000);
          starts.setHours(21, 30, 0, 0);
          await supabaseAdmin.from("dance_dates").insert({
            request_id: withSofia.id,
            created_by: sofia!,
            venue: "Bar Tejo — Cais do Sodré, Lisbon",
            style: "Bachata",
            starts_at: starts.toISOString(),
            notes: "Social starts at 22:00, class before if you're early.",
          });
        }
      }
    }

    // Keep already-connected dancers out of the discovery feed.
    const connected = [sofia, diego, tara, kenji].filter(Boolean) as string[];
    if (connected.length) {
      await supabaseAdmin
        .from("feed_skips")
        .upsert(
          connected.map((id) => ({ user_id: userId, skipped_id: id })),
          { onConflict: "user_id,skipped_id" },
        );
    }

    return { provisioned: true as const };
  });
