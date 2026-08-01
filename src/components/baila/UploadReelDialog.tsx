import { useRef, useState } from "react";
import { X, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { DANCE_STYLES, bailaStore, putVideo, type Reel } from "@/lib/baila-local";
import { capturePoster } from "@/lib/video-poster";

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(blob);
  });
}

export function UploadReelDialog({
  open,
  onOpenChange,
  defaultDancer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDancer: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dancer, setDancer] = useState(defaultDancer);
  const [style, setStyle] = useState<string>(DANCE_STYLES[0]);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setCaption("");
    setBusy(false);
  };

  const submit = async () => {
    if (!file) {
      toast.error("Pick a dance video first");
      return;
    }
    if (!dancer.trim()) {
      toast.error("Add the dancer's name");
      return;
    }
    setBusy(true);
    try {
      const id = crypto.randomUUID();
      const captured = await capturePoster(file);
      const poster = captured?.blob ? await blobToDataUrl(captured.blob) : null;
      await putVideo(id, file);
      const reel: Reel = {
        id,
        dancer: dancer.trim(),
        style,
        caption: caption.trim(),
        poster,
        duration: captured?.duration ?? 0,
        createdAt: new Date().toISOString(),
      };
      bailaStore.addReel(reel);
      toast.success("Reel added to the floor");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save that video — try a smaller file");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3">
      <div className="w-full max-w-md rounded-3xl bg-baila-cream p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-baila-ink">Add a dance reel</h2>
          <button
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-baila-ink/10 text-baila-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-baila-ink/25 px-4 py-8 text-center"
        >
          <UploadCloud className="h-6 w-6 text-baila-ink/60" />
          <span className="text-sm font-semibold text-baila-ink">
            {file ? file.name : "Choose a video"}
          </span>
          <span className="text-xs text-baila-ink/55">Vertical clips, 5–30 seconds work best</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? [])[0] ?? null;
            e.target.value = "";
            if (picked) setFile(picked);
          }}
        />

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Dancer</span>
            <input
              value={dancer}
              onChange={(e) => setDancer(e.target.value)}
              placeholder="Who's dancing?"
              className="mt-1 w-full rounded-2xl bg-baila-ink/5 px-4 py-3 text-sm text-baila-ink outline-none"
            />
          </label>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Style</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {DANCE_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    style === s ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-baila-ink/55">Caption</span>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional — the mood, the song, the floor"
              className="mt-1 w-full rounded-2xl bg-baila-ink/5 px-4 py-3 text-sm text-baila-ink outline-none"
            />
          </label>
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-baila-ink py-4 text-sm font-semibold text-baila-cream disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Saving…" : "Add to the floor"}
        </button>
      </div>
    </div>
  );
}
