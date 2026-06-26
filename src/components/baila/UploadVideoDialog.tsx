import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export function UploadVideoDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file");
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      toast.error("Video too large. Keep it under 60MB.");
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      setProgress(35);
      const { error: upErr } = await supabase.storage
        .from("dance-videos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      setProgress(75);

      const duration = await readDuration(file).catch(() => null);

      const { data: existing } = await supabase
        .from("dance_videos")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      const isFirst = !existing || existing.length === 0;

      const { error: insErr } = await supabase.from("dance_videos").insert({
        user_id: userId,
        storage_path: path,
        video_url: path,
        duration_seconds: duration,
        is_main: isFirst,
        position: Date.now(),
      });
      if (insErr) throw insErr;

      setProgress(100);
      await qc.invalidateQueries({ queryKey: ["my-videos"] });
      await qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Dance uploaded");
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        onOpenChange(false);
      }, 300);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Upload a dance video</DialogTitle>
          <DialogDescription>
            Casual beats perfect. Show how you move — kitchen, street, studio, anywhere.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={onFile}
        />

        {!uploading ? (
          <button
            onClick={onPick}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-baila-ink/20 bg-baila-yellow-soft p-10 text-baila-ink transition hover:border-baila-ink/40"
          >
            <Upload className="h-8 w-8" />
            <span className="font-semibold">Tap to choose a clip</span>
            <span className="text-xs text-baila-ink/60">Up to 60s · vertical · max 60MB</span>
          </button>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm text-baila-ink/70">Uploading your moves…</p>
            <Progress value={progress} />
            <p className="text-right text-xs font-semibold text-baila-ink/60">{progress}%</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(v.duration));
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("metadata"));
    };
    v.src = url;
  });
}
