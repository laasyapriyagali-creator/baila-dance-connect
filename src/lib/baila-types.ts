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
  age: number | null;
  languages: string[];
  favorite_style: string | null;
  paused: boolean;
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

export type ConnectionStatus = "pending" | "accepted" | "declined" | "expired" | "completed";

export type ConnectionRequest = {
  id: string;
  from_user: string;
  to_user: string;
  status: ConnectionStatus;
  again_from: boolean;
  again_to: boolean;
  seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DanceDate = {
  id: string;
  request_id: string;
  created_by: string;
  venue: string;
  style: string | null;
  starts_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  user_id: string;
  discovery_styles: string[];
  max_distance_km: number;
  age_min: number;
  age_max: number;
  discoverable: boolean;
  videos_public: boolean;
  notif_master: boolean;
  notif_requests: boolean;
  notif_decisions: boolean;
  notif_again: boolean;
  notif_reminders: boolean;
  blur_explicit: boolean;
  autoplay: boolean;
  video_quality: string;
  trusted_contact: string | null;
  emergency_contact: string | null;
};

export const REQUEST_TTL_HOURS = 24;

export const REPORT_REASONS = [
  "Inappropriate or explicit content",
  "Harassment or hate speech",
  "Fake profile or impersonation",
  "Underage user",
  "Spam or scam",
  "Something else",
] as const;

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Portuguese",
  "German",
  "Italian",
  "Hindi",
  "Tamil",
  "Korean",
  "Japanese",
  "Mandarin",
  "Arabic",
] as const;

export const SAFETY_CHECKLIST = [
  "Meet in a public place — a studio, social or busy park.",
  "Tell a trusted contact where you're going and when.",
  "Keep your own transport home.",
  "Trust your instincts — leave any time you feel off.",
];


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
