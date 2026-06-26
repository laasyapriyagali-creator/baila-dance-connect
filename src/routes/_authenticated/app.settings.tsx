import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, LogOut, Shield, Bell, HardDrive, Music2, LifeBuoy, UserCog } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

const SECTIONS: { title: string; items: { Icon: typeof Bell; label: string; sub?: string }[] }[] = [
  {
    title: "My account",
    items: [
      { Icon: UserCog, label: "Account information", sub: "Email and login" },
    ],
  },
  {
    title: "Privacy & safety",
    items: [
      { Icon: Shield, label: "Profile visibility", sub: "Who can find you" },
      { Icon: Shield, label: "Blocked dancers" },
    ],
  },
  {
    title: "Notifications",
    items: [{ Icon: Bell, label: "Push notifications" }],
  },
  {
    title: "Dance preferences",
    items: [{ Icon: Music2, label: "Preferred styles", sub: "Edit in your profile" }],
  },
  {
    title: "Storage & data",
    items: [{ Icon: HardDrive, label: "Autoplay & video quality" }],
  },
  {
    title: "Support",
    items: [
      { Icon: LifeBuoy, label: "Help center" },
      { Icon: LifeBuoy, label: "Terms of service" },
      { Icon: LifeBuoy, label: "Privacy policy" },
    ],
  },
];

function SettingsPage() {
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/app/profile"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-ink/5 text-baila-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-3xl font-semibold text-baila-ink">Settings</h1>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-baila-ink/50">
              {section.title}
            </p>
            <ul className="overflow-hidden rounded-2xl border border-baila-ink/10 bg-white">
              {section.items.map(({ Icon, label, sub }, i) => (
                <li
                  key={label}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < section.items.length - 1 ? "border-b border-baila-ink/5" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-baila-yellow-soft text-baila-ink">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-baila-ink">{label}</p>
                    {sub && <p className="truncate text-xs text-baila-ink/55">{sub}</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-baila-ink/40" />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-baila-ink/50">Account</p>
          <ul className="overflow-hidden rounded-2xl border border-baila-ink/10 bg-white">
            <li>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-baila-ink/5 text-baila-ink">
                  <LogOut className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-semibold text-baila-ink">Log out</span>
              </button>
            </li>
          </ul>
        </div>
        <p className="pt-2 text-center text-[11px] text-baila-ink/40">Baila · meet through movement</p>
      </div>
    </div>
  );
}
