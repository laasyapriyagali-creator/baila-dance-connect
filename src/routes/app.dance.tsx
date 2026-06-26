import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DANCERS } from "@/data/dancers";
import { useBaila } from "@/store/baila";
import { DanceCard } from "@/components/baila/DanceCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/app/dance")({
  head: () => ({
    meta: [
      { title: "Dance — Baila" },
      { name: "description", content: "Discover dancers in your city." },
    ],
  }),
  component: DancePage,
});

function DancePage() {
  const { index, next, sendRequest } = useBaila();
  const dancer = DANCERS[index];
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSkip = () => next();
  const handleDance = () => setConfirmOpen(true);
  const confirmDance = () => {
    sendRequest(dancer.id);
    setConfirmOpen(false);
    toast.success(`Request sent to ${dancer.name}`, {
      description: "If they say yes, you'll see them in Connections.",
    });
    next();
  };

  return (
    <div className="flex h-[100dvh] flex-col px-4 pb-28 pt-4">
      <header className="mb-3 flex items-center justify-between px-1">
        <span className="font-display text-2xl font-semibold text-baila-ink">Baila</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-baila-ink/50">
          Dance
        </span>
      </header>

      <div
        className="relative flex-1 touch-pan-y"
        onClick={(e) => {
          // tap right half advances
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          if (e.clientX - rect.left > rect.width / 2) next();
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={dancer.id}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.y) > 80) next();
            }}
            className="absolute inset-0"
          >
            <DanceCard dancer={dancer} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-center gap-6">
        <button
          aria-label="Next dancer"
          onClick={handleSkip}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-baila-orange text-white shadow-lg shadow-baila-orange/30 transition active:scale-95"
        >
          <ChevronRight className="h-7 w-7" strokeWidth={2.5} />
        </button>
        <button
          aria-label="Dance with me"
          onClick={handleDance}
          className="flex h-20 items-center gap-2 rounded-full bg-baila-green px-7 text-white shadow-lg shadow-baila-green/30 transition active:scale-95"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Dance With Me</span>
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              Dance with {dancer.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We'll let them know you'd like to dance. No chatting — if they say yes, you'll
              meet for real.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Not now</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDance}
              className="rounded-full bg-baila-green text-white hover:bg-baila-green/90"
            >
              Yes, send request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
