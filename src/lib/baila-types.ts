export type Experience = "Beginner" | "Intermediate" | "Advanced" | "Pro";
export type AppRole = "dancer" | "instructor" | "organizer";

export type Social = { label: string; url: string };

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  headline: string | null;
  city: string | null;
  experience: Experience | null;
  years_dancing: number | null;
  availability: string[];
  role: AppRole;
  avatar_url: string | null;
  cover_url: string | null;
  dance_styles: string[];
  socials: Social[];
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type DanceVideo = {
  id: string;
  user_id: string;
  storage_path: string;
  video_url: string;
  poster_url: string | null;
  duration_seconds: number | null;
  position: number;
  is_main: boolean;
  created_at: string;
};

export type ConnectionRequest = {
  id: string;
  from_user: string;
  to_user: string;
  status: "pending" | "accepted" | "declined";
  again_from: boolean;
  again_to: boolean;
  seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DanceClass = {
  id: string;
  instructor_id: string;
  title: string;
  style: string;
  level: string;
  city: string | null;
  recurrence: string | null;
  description: string | null;
  cover_path: string | null;
  created_at: string;
  updated_at: string;
};

export type DanceEvent = {
  id: string;
  organizer_id: string;
  title: string;
  style: string | null;
  city: string | null;
  venue: string | null;
  starts_at: string;
  description: string | null;
  cover_path: string | null;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  kind: "connection_request" | "connection_accepted" | "new_class" | "new_event" | string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export const DANCE_STYLES = [
  "Freestyle",
  "Hip-hop",
  "K-pop",
  "Salsa",
  "Classical",
  "Bachata",
  "Afrobeat",
  "House",
  "Contemporary",
  "Kizomba",
  "Tango",
  "Other",
] as const;

export const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
export const AVAILABILITY = ["Weeknights", "Weekends", "Mornings", "Afternoons", "Late night"] as const;
export const ROLE_LABEL: Record<AppRole, string> = {
  dancer: "Dancer",
  instructor: "Instructor",
  organizer: "Organizer",
};

export const ICE_BREAKERS = [
  "Trade your favorite 4-count groove",
  "Mirror each other for 30 seconds — no leading",
  "Pick a song neither of you have danced to before",
  "Freestyle to silence, then drop the beat",
  "One move from your earliest dance memory",
  "Slow it down 50% and exaggerate every step",
  "Swap the move you've been working on this week",
  "Dance the same phrase in two different styles",
];

// Tiny curated venue suggestion list. Extend as community grows.
export const VENUES_BY_CITY: Record<string, { name: string; vibe: string }[]> = {};
