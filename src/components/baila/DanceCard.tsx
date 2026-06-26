import { motion } from "framer-motion";
import { MapPin, Play } from "lucide-react";
import { SignedVideo } from "@/components/baila/SignedMedia";
import type { Profile, DanceVideo } from "@/lib/baila-types";

export type FeedItem = { profile: Profile; mainVideo: DanceVideo };

export function DanceCard({ item }: { item: FeedItem }) {
  const { profile, mainVideo } = item;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative h-full w-full overflow-hidden rounded-[2rem] bg-baila-ink"
    >
      <SignedVideo
        bucket="dance-videos"
        path={mainVideo.storage_path}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-baila-ink/20 via-transparent to-baila-yellow/10"
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
        <Play className="h-3 w-3" fill="currentColor" /> Dance video
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 pt-24">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 text-white">
            <h2 className="truncate font-display text-3xl font-semibold leading-none">
              {profile.display_name || profile.username || "Dancer"}
            </h2>
            {profile.city && (
              <div className="mt-2 flex items-center gap-1.5 text-sm opacity-90">
                <MapPin className="h-4 w-4" />
                {profile.city}
              </div>
            )}
          </div>
          {profile.dance_styles[0] && (
            <span className="rounded-full bg-baila-yellow px-3 py-1.5 text-xs font-bold text-baila-ink">
              {profile.dance_styles[0]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
