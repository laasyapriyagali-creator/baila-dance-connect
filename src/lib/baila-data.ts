import { supabase } from "@/integrations/supabase/client";
import type { Profile, UserSettings } from "@/lib/baila-types";
import { REQUEST_TTL_HOURS } from "@/lib/baila-types";

/** Default settings row shape used before the user has saved anything. */
export const DEFAULT_SETTINGS: Omit<UserSettings, "user_id"> = {
  discovery_styles: [],
  max_distance_km: 50,
  age_min: 18,
  age_max: 60,
  discoverable: true,
  videos_public: true,
  notif_master: true,
  notif_requests: true,
  notif_decisions: true,
  notif_again: true,
  notif_reminders: true,
  blur_explicit: true,
  autoplay: true,
  video_quality: "auto",
  trusted_contact: null,
  emergency_contact: null,
};

export async function fetchSettings(userId: string): Promise<UserSettings> {
  const { data } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data as unknown as UserSettings;
  return { user_id: userId, ...DEFAULT_SETTINGS };
}

export async function saveSettings(userId: string, patch: Partial<Omit<UserSettings, "user_id">>) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as unknown as Profile) ?? null;
}

/** Ids the current user must never see: people they blocked and people who blocked them. */
export async function fetchBlockedIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("blocks")
    .select("blocker_id,blocked_id")
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  const ids = new Set<string>();
  (data ?? []).forEach((b) => {
    ids.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
  });
  return Array.from(ids);
}

export async function blockUser(userId: string, blockedId: string) {
  const { error } = await supabase.from("blocks").insert({ blocker_id: userId, blocked_id: blockedId });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function unblockUser(userId: string, blockedId: string) {
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

export async function reportUser(args: {
  reporterId: string;
  reportedId: string;
  reason: string;
  note?: string;
  videoId?: string | null;
}) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: args.reporterId,
    reported_id: args.reportedId,
    reason: args.reason,
    note: args.note ?? null,
    video_id: args.videoId ?? null,
  });
  if (error) throw error;
}

/** Dance requests go stale after 24h with no answer. */
export function isExpiredPending(status: string, createdAt: string) {
  if (status !== "pending") return false;
  return Date.now() - new Date(createdAt).getTime() > REQUEST_TTL_HOURS * 3_600_000;
}

/**
 * Flips any of the current user's stale pending requests to `expired`.
 * Both parties may update their own rows, so this is safe under RLS.
 */
export async function expireStaleRequests(userId: string) {
  const cutoff = new Date(Date.now() - REQUEST_TTL_HOURS * 3_600_000).toISOString();
  await supabase
    .from("connection_requests")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .or(`from_user.eq.${userId},to_user.eq.${userId}`);
}

export async function recordSkip(userId: string, skippedId: string) {
  await supabase
    .from("feed_skips")
    .upsert({ user_id: userId, skipped_id: skippedId }, { onConflict: "user_id,skipped_id" });
}

export async function fetchSkippedIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from("feed_skips").select("skipped_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.skipped_id);
}

export async function resetSkips(userId: string) {
  const { error } = await supabase.from("feed_skips").delete().eq("user_id", userId);
  if (error) throw error;
}
