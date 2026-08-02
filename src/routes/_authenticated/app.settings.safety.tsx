import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, UserX, BadgeCheck, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { unblockUser } from "@/lib/baila-data";
import { useSettings } from "@/lib/use-settings";
import { SAFETY_CHECKLIST, type Profile } from "@/lib/baila-types";
import { Button, Card, EmptyState, Field, Input, Page, Skeleton, Toggle } from "@/components/ui-baila";

export const Route = createFileRoute("/_authenticated/app/settings/safety")({
  head: () => ({
    meta: [
      { title: "Privacy & safety — Baila" },
      { name: "description", content: "Manage blocked dancers, trusted contacts and safety preferences." },
      { property: "og:title", content: "Privacy & safety — Baila" },
      { property: "og:description", content: "Manage blocked dancers, trusted contacts and safety preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SafetySettingsPage,
});

function SafetySettingsPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { settings, update } = useSettings();

  const [trusted, setTrusted] = useState("");
  const [emergency, setEmergency] = useState("");

  useEffect(() => {
    if (!settings) return;
    setTrusted(settings.trusted_contact ?? "");
    setEmergency(settings.emergency_contact ?? "");
  }, [settings]);

  const { data: blocked, isLoading } = useQuery({
    queryKey: ["blocked-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: blocks, error } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user!.id);
      if (error) throw error;
      const ids = (blocks ?? []).map((b) => b.blocked_id);
      if (ids.length === 0) return [] as Profile[];
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
      return (profiles ?? []) as Profile[];
    },
  });

  const unblock = async (id: string) => {
    if (!user) return;
    try {
      await unblockUser(user.id, id);
      qc.invalidateQueries({ queryKey: ["blocked-list", user.id] });
      toast.success("Dancer unblocked.");
    } catch {
      toast.error("Couldn't unblock. Try again.");
    }
  };

  return (
    <Page className="pb-10">
      <Header title="Privacy & safety" />

      <div className="space-y-6">
        <Field label="Blocked dancers">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !blocked || blocked.length === 0 ? (
            <Card className="p-4">
              <EmptyState icon={<UserX className="h-6 w-6" />} title="No one blocked" body="Dancers you block will show up here." />
            </Card>
          ) : (
            <Card className="divide-y divide-baila-ink/[0.06] overflow-hidden">
              {blocked.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-baila-ink">{p.display_name || p.username}</p>
                    {p.city && <p className="truncate text-xs text-baila-ink/50">{p.city}</p>}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => unblock(p.id)}>Unblock</Button>
                </div>
              ))}
            </Card>
          )}
        </Field>

        <Field label="Trusted contact" hint="Someone who knows you're using Baila">
          <Input
            value={trusted}
            onChange={(e) => setTrusted(e.target.value)}
            onBlur={() => update({ trusted_contact: trusted || null })}
            placeholder="Name or phone number"
          />
        </Field>

        <Field label="Emergency contact" hint="Stored privately on your account">
          <Input
            value={emergency}
            onChange={(e) => setEmergency(e.target.value)}
            onBlur={() => update({ emergency_contact: emergency || null })}
            placeholder="Name or phone number"
          />
        </Field>

        <Field label="Content">
          <Card className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[15px] font-semibold text-baila-ink">Blur explicit content</p>
              <p className="text-xs text-baila-ink/50">Blur flagged videos until you tap through</p>
            </div>
            <Toggle checked={settings?.blur_explicit ?? true} onCheckedChange={(v) => update({ blur_explicit: v })} label="Blur explicit content" />
          </Card>
        </Field>

        <Field label="Safety checklist">
          <Card className="divide-y divide-baila-ink/[0.06] overflow-hidden">
            {SAFETY_CHECKLIST.map((item) => (
              <div key={item} className="flex items-start gap-3 px-4 py-3.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-baila-ink/40" />
                <p className="text-sm leading-relaxed text-baila-ink/70">{item}</p>
              </div>
            ))}
          </Card>
        </Field>

        <Field label="Verification">
          <Card className="flex items-center gap-3.5 px-4 py-4 opacity-60">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-baila-yellow-soft text-baila-ink">
              <BadgeCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-baila-ink">ID verification</p>
              <p className="truncate text-xs text-baila-ink/50">Coming soon</p>
            </div>
          </Card>
        </Field>
      </div>
    </Page>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link
        to="/app/settings"
        aria-label="Back"
        className="press flex h-11 w-11 items-center justify-center rounded-full border border-baila-ink/10 bg-white text-baila-ink shadow-soft"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="font-display text-[2rem] font-semibold tracking-[-0.03em] text-baila-ink">{title}</h1>
    </div>
  );
}
