import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Star, MapPin, Play } from "lucide-react";
import { useBaila, type Connection } from "@/store/baila";

export const Route = createFileRoute("/app/connections")({
  head: () => ({
    meta: [
      { title: "Connections — Baila" },
      { name: "description", content: "Your dance connections and requests." },
    ],
  }),
  component: ConnectionsPage,
});

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "past", label: "Past" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function ConnectionsPage() {
  const { connections, acceptRequest, declineRequest, toggleDanceAgain } = useBaila();
  const [tab, setTab] = useState<TabKey>("pending");

  const grouped: Record<TabKey, Connection[]> = {
    pending: connections.filter((c) => c.status === "pending_in" || c.status === "pending_out"),
    active: connections.filter((c) => c.status === "active"),
    past: connections.filter((c) => c.status === "past"),
  };
  const items = grouped[tab];

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-baila-ink">Connections</h1>
        <p className="mt-1 text-sm text-baila-ink/60">
          Real people, real dances. No chatting required.
        </p>
      </header>

      <div className="mb-5 flex rounded-full bg-baila-ink/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-baila-yellow text-baila-ink shadow-sm"
                : "text-baila-ink/60"
            }`}
          >
            {t.label}
            {grouped[t.key].length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{grouped[t.key].length}</span>
            )}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-baila-ink/10 bg-white p-3"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-baila-ink">
                <img
                  src={c.dancer.poster}
                  alt={`${c.dancer.name} dance video`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur">
                    <Play className="h-3 w-3" fill="currentColor" />
                  </span>
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-lg font-semibold text-baila-ink">
                    {c.dancer.name}
                  </p>
                  <span className="rounded-full bg-baila-yellow px-2 py-0.5 text-[10px] font-bold text-baila-ink">
                    {c.dancer.style}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-baila-ink/60">
                  <MapPin className="h-3 w-3" />
                  {c.dancer.city}
                  {c.status === "pending_out" && (
                    <span className="ml-2 italic">· awaiting reply</span>
                  )}
                </div>
              </div>
              {c.status === "pending_in" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => declineRequest(c.id)}
                    aria-label="Decline"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-ink/5 text-baila-ink/70"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => acceptRequest(c.id)}
                    aria-label="Accept"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-baila-green text-white"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                </div>
              )}
              {(c.status === "active" || c.status === "past") && (
                <button
                  onClick={() => toggleDanceAgain(c.id)}
                  aria-label="Dance again"
                  className={`flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold transition ${
                    c.danceAgain
                      ? "bg-baila-yellow text-baila-ink"
                      : "bg-baila-ink/5 text-baila-ink/70"
                  }`}
                >
                  <Star
                    className="h-4 w-4"
                    fill={c.danceAgain ? "currentColor" : "none"}
                  />
                  Again
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const copy = {
    pending: "No pending requests. Keep dancing — someone might say yes soon.",
    active: "No active connections yet. Find someone whose energy matches yours.",
    past: "Past dances will show up here.",
  }[tab];
  return (
    <div className="mt-16 rounded-3xl border border-dashed border-baila-ink/15 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-baila-yellow">
        <Star className="h-6 w-6 text-baila-ink" />
      </div>
      <p className="text-sm text-baila-ink/70">{copy}</p>
    </div>
  );
}
