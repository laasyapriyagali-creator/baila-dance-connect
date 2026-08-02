import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { reportUser } from "@/lib/baila-data";
import { REPORT_REASONS } from "@/lib/baila-types";
import { Button, Chip, ModalSheet, Textarea } from "@/components/ui-baila";
import { Flag } from "lucide-react";

export function ReportSheet({
  open,
  onOpenChange,
  reportedId,
  videoId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reportedId: string;
  videoId?: string | null;
}) {
  const { user } = useSession();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    onOpenChange(false);
    setReason(null);
    setNote("");
  };

  const submit = async () => {
    if (!user) return;
    if (!reason) return toast.error("Choose a reason");
    setSubmitting(true);
    try {
      await reportUser({ reporterId: user.id, reportedId, reason, note: note.trim() || undefined, videoId });
      toast.success("Thanks — our team will review this.");
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalSheet open={open} onClose={close} label="Report dancer">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-baila-ink/[0.06] text-baila-ink/60">
        <Flag className="h-6 w-6" />
      </span>
      <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-baila-ink">Report this dancer</h3>
      <p className="mt-2 text-sm leading-relaxed text-baila-ink/60">
        Tell us what's wrong. Reports are confidential.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {REPORT_REASONS.map((r) => (
          <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
            {r}
          </Chip>
        ))}
      </div>
      <Textarea
        className="mt-4"
        rows={3}
        placeholder="Add details (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 500))}
      />
      <div className="mt-6 flex gap-2.5">
        <Button variant="ghost" block className="h-12" onClick={close}>
          Cancel
        </Button>
        <Button variant="danger" block className="h-12" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit report"}
        </Button>
      </div>
    </ModalSheet>
  );
}
