import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import {
  DANCE_STYLES,
  ROLE_LABEL,
  type AppRole,
  type Experience,
  type Profile,
} from "@/lib/baila-types";
import { UploadVideoDialog } from "@/components/baila/UploadVideoDialog";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  component: Onboarding,
});

const STEPS = ["role", "identity", "styles", "reel"] as const;
type Step = (typeof STEPS)[number];

function Onboarding() {
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data as Profile | null;
    },
  });

  const [form, setForm] = useState({
    role: "dancer" as AppRole,
    display_name: "",
    username: "",
    city: "",
    experience: "Beginner" as Experience,
    dance_styles: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        role: profile.role ?? "dancer",
        display_name: profile.display_name ?? "",
        username: profile.username ?? "",
        city: profile.city ?? "",
        experience: (profile.experience ?? "Beginner") as Experience,
        dance_styles: profile.dance_styles ?? [],
      }));
    }
  }, [profile]);

  const { data: videoCount } = useQuery({
    queryKey: ["onboarding-videos", user?.id],
    enabled: !!user && step === "reel",
    refetchInterval: 4_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("dance_videos")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const stepIdx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(stepIdx - 1, 0)]);

  const persist = async (extra: Partial<Profile> = {}) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        role: form.role,
        display_name: form.display_name.trim() || null,
        username: form.username.trim() || null,
        city: form.city.trim() || null,
        experience: form.experience,
        dance_styles: form.dance_styles,
        ...extra,
      })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    return true;
  };

  const finish = async () => {
    const ok = await persist({ onboarded: true });
    if (ok) navigate({ to: "/app/dance" });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-10 pt-10">
      <div className="mb-8 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition ${i <= stepIdx ? "bg-baila-ink" : "bg-baila-ink/15"}`}
          />
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
        {step === "role" && (
          <>
            <h1 className="font-display text-3xl font-semibold text-baila-ink">Welcome to Baila</h1>
            <p className="mt-2 text-sm text-baila-ink/65">How will you show up here?</p>
            <div className="mt-6 space-y-2">
              {(["dancer", "instructor", "organizer"] as AppRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={`w-full rounded-2xl border-2 px-4 py-4 text-left transition ${
                    form.role === r ? "border-baila-ink bg-baila-yellow" : "border-baila-ink/10 bg-white"
                  }`}
                >
                  <p className="font-display text-lg font-semibold text-baila-ink">{ROLE_LABEL[r]}</p>
                  <p className="text-sm text-baila-ink/65">
                    {r === "dancer" && "Discover dancers and meet for real-life dances."}
                    {r === "instructor" && "Publish classes so dancers find your teaching."}
                    {r === "organizer" && "Announce socials, jams, and events to the community."}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "identity" && (
          <>
            <h1 className="font-display text-3xl font-semibold text-baila-ink">Tell us who you are</h1>
            <p className="mt-2 text-sm text-baila-ink/65">No bios required yet — keep it simple.</p>
            <div className="mt-6 space-y-3">
              <Input value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} label="Display name" placeholder="What should we call you?" />
              <Input
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v.replace(/[^a-z0-9._]/gi, "").toLowerCase() })}
                label="Username"
                placeholder="username"
              />
              <Input value={form.city} onChange={(v) => setForm({ ...form, city: v })} label="City" placeholder="Where you dance most" />
            </div>
          </>
        )}

        {step === "styles" && (
          <>
            <h1 className="font-display text-3xl font-semibold text-baila-ink">Your dance DNA</h1>
            <p className="mt-2 text-sm text-baila-ink/65">Pick the styles you live for.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {DANCE_STYLES.map((s) => {
                const on = form.dance_styles.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() =>
                      setForm({
                        ...form,
                        dance_styles: on ? form.dance_styles.filter((x) => x !== s) : [...form.dance_styles, s],
                      })
                    }
                    className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                      on ? "bg-baila-yellow text-baila-ink" : "bg-baila-ink/5 text-baila-ink/70"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-baila-ink/55">Experience</p>
              <div className="flex flex-wrap gap-2">
                {(["Beginner", "Intermediate", "Advanced", "Pro"] as Experience[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => setForm({ ...form, experience: e })}
                    className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
                      form.experience === e ? "bg-baila-ink text-baila-cream" : "bg-baila-ink/5 text-baila-ink/70"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === "reel" && (
          <>
            <h1 className="font-display text-3xl font-semibold text-baila-ink">Drop a dance</h1>
            <p className="mt-2 text-sm text-baila-ink/65">
              {form.role === "dancer"
                ? "Your first clip is how others discover you. Keep it short, real, and yours."
                : "Optional — but a clip helps dancers feel your energy first."}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-baila-ink/15 bg-baila-yellow-soft p-8 text-center">
              <Sparkles className="h-7 w-7 text-baila-ink" />
              <p className="font-display text-lg text-baila-ink">
                {videoCount && videoCount > 0
                  ? `${videoCount} video${videoCount === 1 ? "" : "s"} ready`
                  : "No dances yet"}
              </p>
              <button
                onClick={() => setUploadOpen(true)}
                className="rounded-full bg-baila-ink px-5 py-2.5 text-sm font-semibold text-baila-cream"
              >
                {videoCount && videoCount > 0 ? "Upload another" : "Upload first dance"}
              </button>
            </div>
          </>
        )}
      </motion.div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={back} disabled={stepIdx === 0} className="text-sm font-semibold text-baila-ink/60 disabled:opacity-30">
          Back
        </button>
        {step !== "reel" ? (
          <button
            onClick={async () => {
              if (step === "identity" && !form.display_name.trim()) return toast.error("Add a display name");
              if (step === "styles" && form.dance_styles.length === 0) return toast.error("Pick at least one style");
              await persist();
              next();
            }}
            className="flex items-center gap-1.5 rounded-full bg-baila-ink px-5 py-3 text-sm font-semibold text-baila-cream"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={finish}
            className="flex items-center gap-1.5 rounded-full bg-baila-green px-5 py-3 text-sm font-semibold text-white"
          >
            Enter Baila <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {user && <UploadVideoDialog userId={user.id} open={uploadOpen} onOpenChange={setUploadOpen} />}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-baila-ink/55">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-baila-ink/15 bg-white px-4 py-3 text-[15px] focus-visible:border-baila-ink focus-visible:outline-none"
      />
    </label>
  );
}
