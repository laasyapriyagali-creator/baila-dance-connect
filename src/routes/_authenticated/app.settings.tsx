import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Shield,
  Bell,
  HardDrive,
  Compass,
  LifeBuoy,
  UserCog,
  Mail,
  KeyRound,
  Download,
  Trash2,
  PlayCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery as useQueryProfile, useQueryClient, useMutation as useMutationProfile } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useSettings } from "@/lib/use-settings";
import { downloadMyData, deleteMyData } from "@/lib/export-data";
import { Button, Card, Field, Input, ModalSheet, Page, Segmented, Toggle } from "@/components/ui-baila";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Baila" },
      { name: "description", content: "Manage your Baila account, privacy, notifications and playback preferences." },
      { property: "og:title", content: "Settings — Baila" },
      { property: "og:description", content: "Manage your Baila account, privacy, notifications and playback preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

type SupportDoc = { title: string; body: string };
const SUPPORT_DOCS: Record<string, SupportDoc> = {
  help: {
    title: "Help center",
    body: "Need a hand? Reach us any time at support@baila.app and we'll get back within a day. Most questions about matching, requests and videos are answered in-app under each feature's info icon.",
  },
  terms: {
    title: "Terms of service",
    body: "By using Baila you agree to treat other dancers with respect, keep your profile accurate, and use the app only to arrange real dance meetups. Breaking these terms may result in suspension.",
  },
  privacy: {
    title: "Privacy policy",
    body: "We only use your data to power matching, requests and safety features. Your videos and profile are visible per your privacy settings. You can export or delete your data at any time below.",
  },
};

function SettingsPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { settings, update } = useSettings();

  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [docOpen, setDocOpen] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const changeEmail = async () => {
    if (!newEmail.trim()) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Couldn't update email.");
      return;
    }
    toast.success("Check your inbox to confirm the new email.");
    setEmailOpen(false);
    setNewEmail("");
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Couldn't update password.");
      return;
    }
    toast.success("Password updated.");
    setPasswordOpen(false);
    setNewPassword("");
  };

  const clearCache = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("baila") || k.includes("signed"))
        .forEach((k) => localStorage.removeItem(k));
      toast.success("Cache cleared.");
    } catch {
      toast.error("Couldn't clear cache.");
    }
  };

  const download = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await downloadMyData(user.id);
      toast.success("Your data is downloading.");
    } catch {
      toast.error("Couldn't export your data. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    if (!user || deleteConfirm !== "DELETE") return;
    setBusy(true);
    const { ok, errors } = await deleteMyData(user.id);
    setBusy(false);
    if (!ok) {
      toast.error(`Some data couldn't be removed: ${errors[0]}`);
    } else {
      toast.success("Your data has been deleted.");
    }
    setDeleteOpen(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Page className="pb-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/app/profile"
          aria-label="Back"
          className="press flex h-11 w-11 items-center justify-center rounded-full border border-baila-ink/10 bg-white text-baila-ink shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-[2rem] font-semibold tracking-[-0.03em] text-baila-ink">Settings</h1>
      </div>

      <div className="space-y-6">
        <Group title="My account">
          <Row Icon={UserCog} label="Account information" sub="Email, join date and stats" to="/app/settings/account" />
          <RowButton Icon={Mail} label="Change email" onClick={() => setEmailOpen(true)} />
          <RowButton Icon={KeyRound} label="Change password" onClick={() => setPasswordOpen(true)} last />
        </Group>

        <Group title="Privacy & safety">
          <PauseRow />
          <SwitchRow
            Icon={Shield}
            label="Profile visibility"
            sub="Appear in other dancers' feeds"
            checked={settings?.discoverable ?? true}
            onChange={(v) => update({ discoverable: v })}
          />
          <SwitchRow
            Icon={PlayCircle}
            label="Who can see my videos"
            sub="Keep your reel public"
            checked={settings?.videos_public ?? true}
            onChange={(v) => update({ videos_public: v })}
          />
          <Row Icon={Shield} label="Blocked dancers" to="/app/settings/safety" last />
        </Group>

        <Group title="Discovery">
          <Row Icon={Compass} label="Discovery preferences" sub="Styles, distance, age range" to="/app/settings/discovery" last />
        </Group>

        <Group title="Notifications">
          <Row Icon={Bell} label="Notification preferences" to="/app/settings/notifications" last />
        </Group>

        <Group title="Storage & data">
          <Field label="Video quality" className="px-4 pt-4">
            <Segmented
              value={(settings?.video_quality ?? "auto") as "auto" | "low" | "high"}
              onChange={(v) => update({ video_quality: v })}
              options={[
                { key: "auto", label: "Auto" },
                { key: "low", label: "Low" },
                { key: "high", label: "High" },
              ]}
            />
          </Field>
          <SwitchRow
            Icon={PlayCircle}
            label="Autoplay videos"
            sub="Play dances as you scroll"
            checked={settings?.autoplay ?? true}
            onChange={(v) => update({ autoplay: v })}
          />
          <RowButton Icon={HardDrive} label="Clear cache" onClick={clearCache} last />
        </Group>

        <Group title="Support">
          <RowButton Icon={LifeBuoy} label="Help center" onClick={() => setDocOpen("help")} />
          <RowButton Icon={LifeBuoy} label="Terms of service" onClick={() => setDocOpen("terms")} />
          <RowButton Icon={LifeBuoy} label="Privacy policy" onClick={() => setDocOpen("privacy")} last />
        </Group>

        <Group title="Account">
          <RowButton Icon={Download} label="Download my data" onClick={download} />
          <RowButton
            Icon={Trash2}
            label="Delete my data"
            danger
            onClick={() => setDeleteOpen(true)}
          />
          <RowButton Icon={LogOut} label="Log out" danger onClick={logout} last />
        </Group>

        <p className="pt-2 text-center text-[11px] text-baila-ink/35">Baila · meet through movement</p>
      </div>

      <ModalSheet open={emailOpen} onClose={() => setEmailOpen(false)} label="Change email">
        <h2 className="mb-4 font-display text-xl font-semibold text-baila-ink">Change email</h2>
        <Field label="New email">
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" block onClick={() => setEmailOpen(false)}>Cancel</Button>
          <Button block disabled={busy} onClick={changeEmail}>Update</Button>
        </div>
      </ModalSheet>

      <ModalSheet open={passwordOpen} onClose={() => setPasswordOpen(false)} label="Change password">
        <h2 className="mb-4 font-display text-xl font-semibold text-baila-ink">Change password</h2>
        <Field label="New password" hint="At least 8 characters">
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" block onClick={() => setPasswordOpen(false)}>Cancel</Button>
          <Button block disabled={busy} onClick={changePassword}>Update</Button>
        </div>
      </ModalSheet>

      <ModalSheet open={!!docOpen} onClose={() => setDocOpen(null)} label="Support document">
        {docOpen && (
          <>
            <h2 className="mb-3 font-display text-xl font-semibold text-baila-ink">{SUPPORT_DOCS[docOpen].title}</h2>
            <p className="text-sm leading-relaxed text-baila-ink/65">{SUPPORT_DOCS[docOpen].body}</p>
            <Button block className="mt-5" onClick={() => setDocOpen(null)}>Close</Button>
          </>
        )}
      </ModalSheet>

      <ModalSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} label="Delete my data">
        <h2 className="mb-2 font-display text-xl font-semibold text-baila-ink">Delete my data</h2>
        <p className="mb-4 text-sm leading-relaxed text-baila-ink/60">
          This permanently removes your videos, requests, blocks and settings, and resets your profile. Type{" "}
          <span className="font-bold">DELETE</span> to confirm.
        </p>
        <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" block onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" block disabled={busy || deleteConfirm !== "DELETE"} onClick={runDelete}>
            Delete everything
          </Button>
        </div>
      </ModalSheet>
    </Page>
  );
}

function PauseRow() {
  const { data: paused, update } = usePausedProfile();
  return (
    <SwitchRow
      Icon={Shield}
      label="Pause my profile"
      sub="Hide from discovery temporarily"
      checked={paused}
      onChange={update}
    />
  );
}

// tiny inline hook kept local since it touches `profiles.paused`, distinct from user_settings.
function usePausedProfile() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data } = useQueryProfile({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const mutate = useMutationProfile({
    mutationFn: async (v: boolean) => {
      const { error } = await supabase.from("profiles").update({ paused: v }).eq("id", user!.id);
      if (error) throw error;
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["profile", user?.id] });
      const prev = qc.getQueryData<any>(["profile", user?.id]);
      if (prev) qc.setQueryData(["profile", user?.id], { ...prev, paused: v });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["profile", user?.id], ctx.prev);
      toast.error("Couldn't update that.");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });
  return { data: data?.paused ?? false, update: (v: boolean) => mutate.mutate(v) };
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-baila-ink/40">{title}</p>
      <Card className="overflow-hidden">{children}</Card>
    </section>
  );
}

function Row({
  Icon,
  label,
  sub,
  to,
  last,
}: {
  Icon: typeof Bell;
  label: string;
  sub?: string;
  to: string;
  last?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-baila-yellow-soft/40 ${
        last ? "" : "border-b border-baila-ink/[0.06]"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-baila-yellow-soft text-baila-ink">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-baila-ink">{label}</p>
        {sub && <p className="truncate text-xs text-baila-ink/50">{sub}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-baila-ink/30" />
    </Link>
  );
}

function RowButton({
  Icon,
  label,
  sub,
  onClick,
  last,
  danger,
}: {
  Icon: typeof Bell;
  label: string;
  sub?: string;
  onClick: () => void;
  last?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`press flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-baila-yellow-soft/40 ${
        last ? "" : "border-b border-baila-ink/[0.06]"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
          danger ? "bg-destructive/10 text-destructive" : "bg-baila-yellow-soft text-baila-ink"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] font-semibold ${danger ? "text-destructive" : "text-baila-ink"}`}>{label}</p>
        {sub && <p className="truncate text-xs text-baila-ink/50">{sub}</p>}
      </div>
      {!danger && <ChevronRight className="h-4 w-4 shrink-0 text-baila-ink/30" />}
    </button>
  );
}

function SwitchRow({
  Icon,
  label,
  sub,
  checked,
  onChange,
  last,
}: {
  Icon: typeof Bell;
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3.5 px-4 py-4 ${last ? "" : "border-b border-baila-ink/[0.06]"}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-baila-yellow-soft text-baila-ink">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-baila-ink">{label}</p>
        {sub && <p className="truncate text-xs text-baila-ink/50">{sub}</p>}
      </div>
      <Toggle checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}
