import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Flag, ShieldOff } from "lucide-react";
import { Group, SettingsShell, TextRow, ToggleRow } from "@/components/baila/settings-ui";
import { bailaStore } from "@/lib/baila-local";
import { useBaila } from "@/lib/use-baila";

export const Route = createFileRoute("/settings/safety")({
  head: () => ({
    meta: [
      { title: "Safety — Baila settings" },
      {
        name: "description",
        content:
          "Block or report dancers, share date details with a trusted contact, and keep the pre-date safety checklist on.",
      },
      { property: "og:title", content: "Safety — Baila settings" },
      { property: "og:description", content: "Blocking, reporting and date safety tools in Baila." },
    ],
  }),
  component: SafetySettings,
});

const REPORT_REASONS = [
  "Not a real dance video",
  "Someone else's video",
  "Nudity or sexual content",
  "Harassment or hate",
  "Looks underage",
  "Scam or fake profile",
  "Something happened on a date",
];

function SafetySettings() {
  const { settings, blocked, reels } = useBaila();
  const s = settings.safety;
  const [blockName, setBlockName] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const dancers = Array.from(new Set(reels.map((r) => r.dancer))).filter(
    (d) => !blocked.some((b) => b.toLowerCase() === d.toLowerCase()),
  );

  return (
    <SettingsShell
      title="Safety"
      backTo="/settings"
      intro="Dancing with a stranger should feel safe. These tools are always free."
    >
      <Group label="Before a date">
        <ToggleRow
          label="Safety checklist before first meets"
          hint="Public place, tell a friend, your own way home."
          checked={s.safetyChecklist}
          onChange={(v) => bailaStore.patchSection("safety", { safetyChecklist: v })}
        />
        <ToggleRow
          label="Share date details with a trusted contact"
          hint="Adds a one-tap share on every planned date."
          checked={s.shareDate}
          onChange={(v) => bailaStore.patchSection("safety", { shareDate: v })}
        />
        <TextRow
          label="Trusted contact name"
          value={s.emergencyName}
          placeholder="Who should know where you are?"
          onChange={(v) => bailaStore.patchSection("safety", { emergencyName: v })}
        />
        <TextRow
          label="Trusted contact phone"
          type="tel"
          value={s.emergencyPhone}
          placeholder="+00 000 000 000"
          onChange={(v) => bailaStore.patchSection("safety", { emergencyPhone: v })}
        />
      </Group>

      <Group label="What I see">
        <ToggleRow
          label="Blur possible explicit videos"
          hint="You choose whether to reveal them."
          checked={s.blurExplicit}
          onChange={(v) => bailaStore.patchSection("safety", { blurExplicit: v })}
        />
      </Group>

      <Group label="Blocked dancers">
        {blocked.length === 0 ? (
          <p className="px-4 py-3 text-sm text-baila-ink/55">No one is blocked.</p>
        ) : (
          blocked.map((b) => (
            <div key={b} className="flex min-h-14 items-center gap-3 px-4 py-3">
              <ShieldOff className="h-4 w-4 text-baila-ink/50" />
              <span className="flex-1 text-sm font-semibold text-baila-ink">{b}</span>
              <button
                onClick={() => {
                  bailaStore.unblock(b);
                  toast.success(`${b} unblocked`);
                }}
                className="rounded-full bg-baila-ink/5 px-3 py-1.5 text-xs font-semibold text-baila-ink"
              >
                Unblock
              </button>
            </div>
          ))
        )}
        <div className="px-4 py-3">
          <span className="block text-sm font-semibold text-baila-ink">Block a dancer</span>
          <div className="mt-2 flex gap-2">
            <input
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              list="baila-dancers"
              placeholder="Dancer name"
              className="w-full rounded-2xl bg-baila-ink/5 px-4 py-2.5 text-sm text-baila-ink outline-none"
            />
            <datalist id="baila-dancers">
              {dancers.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <button
              onClick={() => {
                if (!blockName.trim()) return;
                bailaStore.block(blockName);
                setBlockName("");
                toast.success("Blocked — their reels are hidden");
              }}
              className="shrink-0 rounded-full bg-baila-ink px-4 text-xs font-semibold text-baila-cream"
            >
              Block
            </button>
          </div>
        </div>
      </Group>

      <Group label="Reporting">
        <button
          onClick={() => setReportOpen(true)}
          className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
        >
          <Flag className="h-4 w-4 text-baila-ink/60" />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-baila-ink">Report a dancer or a reel</span>
            <span className="block text-xs text-baila-ink/55">
              Private — never a public comment. Reports go to the Baila team.
            </span>
          </span>
        </button>
      </Group>

      <p className="mb-8 px-1 text-xs text-baila-ink/55">
        Baila is not an emergency service. If you are in danger, call your local emergency number.
      </p>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3">
          <div className="w-full max-w-md rounded-3xl bg-baila-cream p-5">
            <h2 className="font-display text-xl font-semibold text-baila-ink">What happened?</h2>
            <div className="mt-3 space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setReportOpen(false);
                    toast.success("Report sent to the Baila team");
                  }}
                  className="w-full rounded-2xl bg-white/70 px-4 py-3 text-left text-sm font-semibold text-baila-ink"
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => setReportOpen(false)}
              className="mt-4 w-full rounded-full bg-baila-ink/10 py-3 text-sm font-semibold text-baila-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </SettingsShell>
  );
}
