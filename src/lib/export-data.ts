import { supabase } from "@/integrations/supabase/client";

/**
 * Gathers everything Baila knows about the current user and triggers a
 * client-side JSON download. Best-effort per-table — a single failing
 * query won't block the rest of the export.
 */
export async function downloadMyData(userId: string) {
  const safe = async <T,>(label: string, fn: () => Promise<T>): Promise<T | { error: string }> => {
    try {
      return await fn();
    } catch (e) {
      return { error: e instanceof Error ? e.message : `Failed to load ${label}` };
    }
  };

  const [profile, settings, videos, connections, dates] = await Promise.all([
    safe("profile", async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    }),
    safe("settings", async () => {
      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    }),
    safe("videos", async () => {
      const { data, error } = await supabase
        .from("dance_videos")
        .select("id,storage_path,poster_url,duration_seconds,position,is_main,created_at")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    }),
    safe("connections", async () => {
      const { data, error } = await supabase
        .from("connection_requests")
        .select("*")
        .or(`from_user.eq.${userId},to_user.eq.${userId}`);
      if (error) throw error;
      return data;
    }),
    safe("dance dates", async () => {
      const { data, error } = await supabase.from("dance_dates").select("*").eq("created_by", userId);
      if (error) throw error;
      return data;
    }),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile,
    settings,
    videos,
    connections,
    dance_dates: dates,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "baila-data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Best-effort account wipe: storage objects, dependent rows, then profile reset. */
export async function deleteMyData(userId: string): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];

  const tryStep = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      errors.push(`${label}: ${e instanceof Error ? e.message : "failed"}`);
    }
  };

  await tryStep("videos storage", async () => {
    const { data } = await supabase.from("dance_videos").select("storage_path").eq("user_id", userId);
    const paths = (data ?? []).map((v) => v.storage_path).filter(Boolean) as string[];
    if (paths.length) {
      const { error } = await supabase.storage.from("dance-videos").remove(paths);
      if (error) throw error;
    }
  });

  await tryStep("avatar/cover storage", async () => {
    const { data } = await supabase.from("profiles").select("avatar_url,cover_url").eq("id", userId).maybeSingle();
    if (data?.avatar_url) await supabase.storage.from("avatars").remove([data.avatar_url]);
    if (data?.cover_url) await supabase.storage.from("covers").remove([data.cover_url]);
  });

  await tryStep("dance videos rows", async () => {
    const { error } = await supabase.from("dance_videos").delete().eq("user_id", userId);
    if (error) throw error;
  });

  await tryStep("connection requests", async () => {
    const { error } = await supabase
      .from("connection_requests")
      .delete()
      .or(`from_user.eq.${userId},to_user.eq.${userId}`);
    if (error) throw error;
  });

  await tryStep("feed skips", async () => {
    const { error } = await supabase.from("feed_skips").delete().or(`user_id.eq.${userId},skipped_id.eq.${userId}`);
    if (error) throw error;
  });

  await tryStep("blocks", async () => {
    const { error } = await supabase.from("blocks").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (error) throw error;
  });

  await tryStep("settings", async () => {
    const { error } = await supabase.from("user_settings").delete().eq("user_id", userId);
    if (error) throw error;
  });

  await tryStep("profile reset", async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: null,
        bio: null,
        headline: null,
        city: null,
        experience: null,
        years_dancing: null,
        age: null,
        languages: [],
        favorite_style: null,
        paused: true,
        availability: [],
        avatar_url: null,
        cover_url: null,
        dance_styles: [],
        socials: [],
        onboarded: false,
      })
      .eq("id", userId);
    if (error) throw error;
  });

  return { ok: errors.length === 0, errors };
}
