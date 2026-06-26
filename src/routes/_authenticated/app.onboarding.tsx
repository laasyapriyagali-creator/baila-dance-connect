import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Heart, Music2, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { DANCE_STYLES, type Experience, type Profile } from "@/lib/baila-types";
import { UploadVideoDialog } from "@/components/baila/UploadVideoDialog";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  component: Onboarding,
});

const STEPS = ["welcome", "identity", "styles", "reel"] as const;
type Step = (typeof STEPS)[number];

function Onboarding() {
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
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
    if (!user) return false;
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "dancer",
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
        {step === "welcome" && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-baila-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-baila-yellow">
              <Sparkles className="h-3 w-3" /> Welcome to Baila
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-baila-ink">
              Meet your next dance partner.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-baila-ink/70">
              Baila is a community where people connect through movement — not bios, not texts.
              Find someone whose rhythm matches yours and meet for a real dance.
            </p>
            <div className="mt-7 space-y-3">
              <Pillar
                Icon={Music2}
                title="Discover through dance"
                body="Short videos, real energy. No selfies, no swiping on faces."
              />
              <Pillar
                Icon={Heart}
                title="Go on dance dates"
                body="Match with someone, pick a spot, meet on the floor."
              />
              <Pillar
                Icon={Users}
                title="Find your scene"
                body="Build friendships through your local dance community."
              />
            </div>
          </>
        )}

        {step === "identity" && (
          <>
            <h1 className="font-display text-3xl font-semibold text-baila-ink">Who's dancing?</h1>
            <p className="mt-2 text-sm text-baila-ink/65">Just the basics — your dance does the talking.</p>
            <div className="mt-6 space-y-3">
              <Input
                value={form.display_name}
                onChange={(v) => setForm({ ...form, display_name: v })}
                label="Your name"
                placeholder="What should partners call you?"
              />
              <Input
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v.replace(/[^a-z0-9._]/gi, "").toLowerCase() })}
                label="Username"
                placeholder="username"
              />
              <Input
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
                label="City"
                placeholder="Where you dance most"
              />
            </div>
          </>
        )}

        {step === "styles" && (
          <>
            <h1 className="font-display text-3xl font-semibold text-baila-ink">What moves you?</h1>
            <p className="mt-2 text-sm text-baila-ink/65">
              Pick the styles you love — we'll show you partners who feel the same beat.
            </p>
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
            <h1 className="font-display text-3xl font-semibold text-baila-ink">Show your dance.</h1>
            <p className="mt-2 text-sm text-baila-ink/65">
              One short clip is how partners discover you. Keep it real — phone footage is perfect.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-baila-ink/15 bg-baila-yellow-soft p-8 text-center">
              <Music2 className="h-7 w-7 text-baila-ink" />
              <p className="font-display text-lg text-baila-ink">
                {videoCount && videoCount > 0
                  ? `${videoCount} dance${videoCount === 1 ? "" : "s"} ready`
                  : "No dances yet"}
              </p>
              <button
                onClick={() => setUploadOpen(true)}
                className="rounded-full bg-baila-ink px-5 py-2.5 text-sm font-semibold text-baila-cream"
              >
                {videoCount && videoCount > 0 ? "Upload another" : "Upload your first dance"}
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
              if (step === "identity" && !form.display_name.trim()) return toast.error("Add your name");
              if (step === "styles" && form.dance_styles.length === 0) return toast.error("Pick at least one style");
              if (step !== "welcome") await persist();
              next();
            }}
            className="flex items-center gap-1.5 rounded-full bg-baila-ink px-5 py-3 text-sm font-semibold text-baila-cream"
          >
            {step === "welcome" ? "Let's go" : "Continue"} <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={finish}
            className="flex items-center gap-1.5 rounded-full bg-baila-green px-5 py-3 text-sm font-semibold text-white"
          >
            Start dancing <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {user && <UploadVideoDialog userId={user.id} open={uploadOpen} onOpenChange={setUploadOpen} />}
    </div>
  );
}

function Pillar({ Icon, title, body }: { Icon: typeof Music2; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-baila-ink/10 bg-white p-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-baila-yellow text-baila-ink">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-base font-semibold text-baila-ink">{title}</p>
        <p className="mt-0.5 text-sm text-baila-ink/65">{body}</p>
      </div>
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
