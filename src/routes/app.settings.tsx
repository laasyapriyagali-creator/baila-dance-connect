import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  Phone,
  Link2,
  Eye,
  MessageSquare,
  UserX,
  Flag,
  ShieldCheck,
  Heart,
  MessageCircle,
  Send,
  UserPlus,
  CalendarDays,
  Bell,
  AtSign,
  Music2,
  Image as ImageIcon,
  Languages,
  Compass,
  Film,
  PlayCircle,
  Gauge,
  Trash2,
  LifeBuoy,
  Mailbox,
  FileText,
  Shield,
  LogOut,
  CircleX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Baila" },
      { name: "description", content: "Manage your Baila account and preferences." },
    ],
  }),
  component: SettingsPage,
});

type Row = {
  icon: LucideIcon;
  label: string;
  hint?: string;
  destructive?: boolean;
  to?: string;
};

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: "My Account",
    rows: [
      { icon: User, label: "Account Information" },
      { icon: Mail, label: "Change Email" },
      { icon: Lock, label: "Change Password" },
      { icon: Phone, label: "Phone Number" },
      { icon: Link2, label: "Connected Accounts" },
    ],
  },
  {
    title: "Privacy & Safety",
    rows: [
      { icon: Eye, label: "Profile Visibility", hint: "Public" },
      { icon: MessageSquare, label: "Who Can Message Me", hint: "Connections" },
      { icon: UserX, label: "Blocked Users" },
      { icon: Flag, label: "Report a Problem" },
      { icon: ShieldCheck, label: "Community Guidelines" },
    ],
  },
  {
    title: "Notifications",
    rows: [
      { icon: Heart, label: "Likes" },
      { icon: MessageCircle, label: "Comments" },
      { icon: Send, label: "Messages" },
      { icon: UserPlus, label: "Followers" },
      { icon: CalendarDays, label: "Event Notifications" },
      { icon: Bell, label: "Push Notifications" },
      { icon: AtSign, label: "Email Notifications" },
    ],
  },
  {
    title: "Dance Preferences",
    rows: [
      { icon: Music2, label: "Preferred Dance Styles" },
      { icon: ImageIcon, label: "Content Preferences" },
      { icon: Languages, label: "Language", hint: "English" },
      { icon: Compass, label: "Discoverability" },
    ],
  },
  {
    title: "Storage & Data",
    rows: [
      { icon: Film, label: "Video Quality", hint: "Auto" },
      { icon: PlayCircle, label: "Auto-play Videos" },
      { icon: Gauge, label: "Data Saver" },
      { icon: Trash2, label: "Clear Cache" },
    ],
  },
  {
    title: "Support",
    rows: [
      { icon: LifeBuoy, label: "Help Center" },
      { icon: Mailbox, label: "Contact Support" },
      { icon: FileText, label: "Terms of Service" },
      { icon: Shield, label: "Privacy Policy" },
    ],
  },
  {
    title: "Account",
    rows: [
      { icon: LogOut, label: "Log Out", to: "/" },
      { icon: CircleX, label: "Delete Account", destructive: true },
    ],
  },
];

function SettingsPage() {
  return (
    <div className="min-h-[100dvh] pb-10">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-baila-ink/10 bg-baila-cream/95 px-3 py-3 backdrop-blur">
        <Link
          to="/app/profile"
          aria-label="Back to profile"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-baila-ink/5"
        >
          <ArrowLeft className="h-5 w-5 text-baila-ink" />
        </Link>
        <h1 className="font-display text-xl font-semibold text-baila-ink">Settings</h1>
      </header>

      <div className="space-y-7 px-4 pt-6">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-baila-ink/50">
              {section.title}
            </h2>
            <ul className="overflow-hidden rounded-2xl border border-baila-ink/10 bg-white">
              {section.rows.map((row, i) => {
                const Icon = row.icon;
                const content = (
                  <div className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        row.destructive
                          ? "bg-destructive/10 text-destructive"
                          : "bg-baila-yellow-soft text-baila-ink"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={`flex-1 text-[15px] font-medium ${
                        row.destructive ? "text-destructive" : "text-baila-ink"
                      }`}
                    >
                      {row.label}
                    </span>
                    {row.hint && (
                      <span className="text-xs text-baila-ink/50">{row.hint}</span>
                    )}
                    <ChevronRight
                      className={`h-4 w-4 ${
                        row.destructive ? "text-destructive/60" : "text-baila-ink/30"
                      }`}
                    />
                  </div>
                );
                return (
                  <li
                    key={row.label}
                    className={i > 0 ? "border-t border-baila-ink/8" : ""}
                  >
                    {row.to ? (
                      <Link to={row.to} className="block">
                        {content}
                      </Link>
                    ) : (
                      <button className="block w-full">{content}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <p className="pt-2 text-center text-xs text-baila-ink/40">Baila · v0.1.0</p>
      </div>
    </div>
  );
}
