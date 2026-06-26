import { useState } from "react";
import { Upload } from "lucide-react";
import { useBaila } from "@/store/baila";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const SAMPLE_POSTERS = [
  "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80",
];

export function UploadVideoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addVideo = useBaila((s) => s.addVideo);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const start = () => {
    setUploading(true);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 12;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(t);
        const poster = SAMPLE_POSTERS[Math.floor(Math.random() * SAMPLE_POSTERS.length)];
        const dur = `0:${(10 + Math.floor(Math.random() * 40)).toString().padStart(2, "0")}`;
        addVideo({ title: "New dance clip", duration: dur, poster });
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          onOpenChange(false);
        }, 400);
      }
    }, 180);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Upload a dance video</DialogTitle>
          <DialogDescription>
            Casual is better than perfect. Show how you move — kitchen, street, studio, anywhere.
          </DialogDescription>
        </DialogHeader>

        {!uploading ? (
          <button
            onClick={start}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-baila-ink/20 bg-baila-yellow-soft p-10 text-baila-ink transition hover:border-baila-ink/40"
          >
            <Upload className="h-8 w-8" />
            <span className="font-semibold">Tap to choose a clip</span>
            <span className="text-xs text-baila-ink/60">Up to 60 seconds · vertical</span>
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
