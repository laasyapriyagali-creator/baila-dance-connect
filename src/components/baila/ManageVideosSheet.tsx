import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Music2, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DanceVideo } from "@/lib/baila-types";
import { SignedImage } from "@/components/baila/SignedMedia";
import { Button, ModalSheet } from "@/components/ui-baila";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function ManageVideosSheet({
  userId,
  videos,
  open,
  onOpenChange,
}: {
  userId: string;
  videos: DanceVideo[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<DanceVideo | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ordered = [...videos].sort((a, b) => b.position - a.position);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["my-videos", userId] });
    qc.invalidateQueries({ queryKey: ["videos", userId] });
    qc.invalidateQueries({ queryKey: ["feed"] });
  };

  const move = async (video: DanceVideo, direction: "up" | "down") => {
    const idx = ordered.findIndex((v) => v.id === video.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ordered.length) return;
    const other = ordered[swapIdx];
    setBusyId(video.id);
    try {
      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        supabase.from("dance_videos").update({ position: other.position }).eq("id", video.id),
        supabase.from("dance_videos").update({ position: video.position }).eq("id", other.id),
      ]);
      if (e1 || e2) throw e1 ?? e2;
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't reorder");
    } finally {
      setBusyId(null);
    }
  };

  const setMain = async (video: DanceVideo) => {
    setBusyId(video.id);
    const { error } = await supabase.from("dance_videos").update({ is_main: true }).eq("id", video.id);
    setBusyId(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Set as main reel");
      invalidate();
    }
  };

  const confirmRemove = async () => {
    const video = confirmDelete;
    if (!video) return;
    setBusyId(video.id);
    try {
      await supabase.storage.from("dance-videos").remove([video.storage_path]);
      const { error } = await supabase.from("dance_videos").delete().eq("id", video.id);
      if (error) throw error;
      if (video.is_main) {
        const rest = ordered.filter((v) => v.id !== video.id);
        if (rest[0]) await supabase.from("dance_videos").update({ is_main: true }).eq("id", rest[0].id);
      }
      toast.success("Video deleted");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete video");
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-baila-ink/[0.07] bg-card">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl tracking-[-0.02em]">Manage videos</SheetTitle>
            <SheetDescription>Reorder your reel, set your main dance, or remove a video.</SheetDescription>
          </SheetHeader>
          <ul className="space-y-2.5 py-4">
            {ordered.map((v, i) => (
              <li
                key={v.id}
                className="flex items-center gap-3 rounded-2xl border border-baila-ink/[0.07] bg-white p-2.5 shadow-soft"
              >
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-baila-ink">
                  <SignedImage
                    bucket="dance-videos"
                    path={v.poster_url ?? v.storage_path}
                    alt="Dance video"
                    className="absolute inset-0 h-full w-full object-cover"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center text-baila-cream/60">
                        <Music2 className="h-4 w-4" />
                      </div>
                    }
                  />
                  {v.is_main && (
                    <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-baila-yellow text-baila-ink">
                      <Star className="h-3 w-3" fill="currentColor" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-baila-ink">
                    {v.is_main ? "Main reel" : `Video ${ordered.length - i}`}
                  </p>
                  <p className="text-xs text-baila-ink/45">
                    {new Date(v.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0 || busyId === v.id}
                    onClick={() => move(v, "up")}
                    className="press flex h-8 w-8 items-center justify-center rounded-full bg-baila-ink/5 text-baila-ink/70 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={i === ordered.length - 1 || busyId === v.id}
                    onClick={() => move(v, "down")}
                    className="press flex h-8 w-8 items-center justify-center rounded-full bg-baila-ink/5 text-baila-ink/70 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  {!v.is_main && (
                    <button
                      type="button"
                      aria-label="Set as main reel"
                      disabled={busyId === v.id}
                      onClick={() => setMain(v)}
                      className="press flex h-8 w-8 items-center justify-center rounded-full bg-baila-yellow/40 text-baila-ink disabled:opacity-30"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Delete video"
                    disabled={busyId === v.id}
                    onClick={() => setConfirmDelete(v)}
                    className="press flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {ordered.length === 0 && (
              <p className="py-6 text-center text-sm text-baila-ink/50">No videos yet.</p>
            )}
          </ul>
        </SheetContent>
      </Sheet>

      <ModalSheet open={!!confirmDelete} onClose={() => setConfirmDelete(null)} label="Delete video">
        <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-baila-ink">Delete this video?</h3>
        <p className="mt-2 text-sm leading-relaxed text-baila-ink/60">
          This can't be undone. It'll be removed from your reel and the discovery feed right away.
        </p>
        <div className="mt-6 flex gap-2.5">
          <Button variant="ghost" block className="h-12" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" block className="h-12" onClick={confirmRemove}>
            Delete
          </Button>
        </div>
      </ModalSheet>
    </>
  );
}
