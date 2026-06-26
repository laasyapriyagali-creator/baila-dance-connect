import { useRef, useState } from "react";
import { Upload, X, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
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
import { DANCE_STYLES } from "@/lib/baila-types";
import { capturePoster } from "@/lib/video-poster";

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_SECONDS = 90;

type Item = {
  id: string;
  file: File;
  caption: string;
  style: string;
  setMain: boolean;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

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
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (files: FileList | File[]) => {
    const incoming: Item[] = [];
    const videoExt = /\.(mp4|mov|m4v|webm|mkv|avi|3gp|3gpp|hevc|qt)$/i;
    Array.from(files).forEach((file) => {
      const looksLikeVideo =
        (file.type && file.type.startsWith("video/")) || videoExt.test(file.name);
      if (!looksLikeVideo) {
        toast.error(`${file.name} isn't a video.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 100MB.`);
        return;
      }
      incoming.push({
        id: crypto.randomUUID(),
        file,
        caption: "",
        style: "",
        setMain: false,
        progress: 0,
        status: "queued",
      });
    });
    if (incoming.length) setItems((prev) => [...prev, ...incoming]);
  };


  const update = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const uploadOne = async (item: Item) => {
    update(item.id, { status: "uploading", progress: 5, error: undefined });
    try {
      // Probe duration + capture poster.
      const captured = await capturePoster(item.file);
      const duration = captured?.duration ?? 0;
      if (duration && duration > MAX_SECONDS) {
        throw new Error(`Clip is ${duration}s. Keep it under ${MAX_SECONDS}s.`);
      }
      update(item.id, { progress: 20 });

      const ext = item.file.name.split(".").pop()?.toLowerCase() || "mp4";
      const base = `${userId}/${crypto.randomUUID()}`;
      const videoPath = `${base}.${ext}`;
      const posterPath = `${base}.jpg`;

      const contentType = item.file.type || "video/mp4";
      const { error: upErr } = await supabase.storage
        .from("dance-videos")
        .upload(videoPath, item.file, { contentType, upsert: false });
      if (upErr) throw upErr;
      update(item.id, { progress: 70 });

      let posterUploaded = false;
      if (captured?.blob) {
        const { error: posterErr } = await supabase.storage
          .from("dance-videos")
          .upload(posterPath, captured.blob, { contentType: "image/jpeg", upsert: false });
        if (!posterErr) posterUploaded = true;
      }
      update(item.id, { progress: 88 });


      const { data: existing } = await supabase
        .from("dance_videos")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      const isFirst = !existing || existing.length === 0;

      const { error: insErr } = await supabase.from("dance_videos").insert({
        user_id: userId,
        storage_path: videoPath,
        video_url: videoPath,
        poster_url: posterUploaded ? posterPath : null,
        duration_seconds: duration || null,
        is_main: item.setMain || isFirst,
        position: Date.now(),
      });
      if (insErr) throw insErr;

      update(item.id, { progress: 100, status: "done" });
      qc.invalidateQueries({ queryKey: ["my-videos"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      update(item.id, { status: "error", error: msg, progress: 0 });
    }
  };

  const startAll = async () => {
    for (const it of items.filter((x) => x.status === "queued" || x.status === "error")) {
      await uploadOne(it);
    }
    const allDone = items.every((it) => it.status === "done");
    if (allDone) {
      toast.success(items.length === 1 ? "Dance uploaded" : `${items.length} dances uploaded`);
      setTimeout(() => {
        setItems([]);
        onOpenChange(false);
      }, 400);
    }
  };

  const close = () => {
    if (items.some((it) => it.status === "uploading")) {
      toast.error("Wait for uploads to finish.");
      return;
    }
    setItems([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? close() : onOpenChange(v))}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Upload dance videos</DialogTitle>
          <DialogDescription>
            Up to 90s · vertical works best · 100MB max per clip.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const fs = e.target.files;
            e.target.value = "";
            if (fs) addFiles(fs);
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragOver
              ? "border-baila-ink bg-baila-yellow"
              : "border-baila-ink/20 bg-baila-yellow-soft"
          }`}
        >
          <Upload className="h-7 w-7 text-baila-ink" />
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-baila-ink px-4 py-2 text-sm font-semibold text-baila-cream"
          >
            Choose videos
          </button>
          <span className="text-xs text-baila-ink/60">or drop them here</span>
        </div>

        {items.length > 0 && (
          <div role="status" aria-live="polite" className="mt-3 space-y-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-2xl border border-baila-ink/10 bg-white p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-baila-ink">{it.file.name}</p>
                    <p className="text-[11px] text-baila-ink/55">
                      {(it.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  {it.status === "uploading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-baila-ink/60" />
                  ) : it.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-baila-green" />
                  ) : (
                    <button
                      onClick={() => remove(it.id)}
                      aria-label={`Remove ${it.file.name}`}
                      className="text-baila-ink/50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {it.status === "queued" && (
                  <div className="mt-3 space-y-2">
                    <input
                      value={it.caption}
                      onChange={(e) => update(it.id, { caption: e.target.value.slice(0, 80) })}
                      placeholder="Caption (optional)"
                      className="w-full rounded-xl border border-baila-ink/15 bg-white px-3 py-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {DANCE_STYLES.slice(0, 6).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update(it.id, { style: it.style === s ? "" : s })}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            it.style === s
                              ? "bg-baila-yellow text-baila-ink"
                              : "bg-baila-ink/5 text-baila-ink/70"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-baila-ink/70">
                      <input
                        type="checkbox"
                        checked={it.setMain}
                        onChange={(e) => update(it.id, { setMain: e.target.checked })}
                      />
                      Set as my main video
                    </label>
                  </div>
                )}

                {(it.status === "uploading" || it.status === "done") && (
                  <Progress value={it.progress} className="mt-3 h-1.5" />
                )}

                {it.status === "error" && (
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-destructive">
                    <span className="truncate">{it.error}</span>
                    <button
                      onClick={() => uploadOne(it)}
                      className="flex items-center gap-1 rounded-full bg-baila-ink/5 px-2 py-1 font-semibold text-baila-ink"
                    >
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  </div>
                )}
              </div>
            ))}

            {items.some((it) => it.status === "queued" || it.status === "error") && (
              <button
                onClick={startAll}
                className="w-full rounded-full bg-baila-green px-5 py-3 text-sm font-semibold text-white"
              >
                Upload {items.filter((i) => i.status !== "done").length} clip
                {items.filter((i) => i.status !== "done").length === 1 ? "" : "s"}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
