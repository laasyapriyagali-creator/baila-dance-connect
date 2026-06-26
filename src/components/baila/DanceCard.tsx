import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { Dancer } from "@/data/dancers";

export function DanceCard({ dancer }: { dancer: Dancer }) {
  return (
    <motion.div
      key={dancer.id}
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative h-full w-full overflow-hidden rounded-[2rem] bg-baila-ink"
    >
      <img
        src={dancer.poster}
        alt={`${dancer.name} dancing`}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* dancing shimmer */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-tr from-baila-ink/20 via-transparent to-baila-yellow/10"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 pt-24">
        <div className="flex items-end justify-between">
          <div className="text-white">
            <h2 className="font-display text-3xl font-semibold leading-none">
              {dancer.name}
              <span className="ml-2 font-sans text-2xl font-medium opacity-80">
                {dancer.age}
              </span>
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-sm opacity-90">
              <MapPin className="h-4 w-4" />
              {dancer.city}
            </div>
          </div>
          <span className="rounded-full bg-baila-yellow px-3 py-1.5 text-xs font-bold text-baila-ink">
            {dancer.style}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
