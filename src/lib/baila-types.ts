export type Experience = "Beginner" | "Intermediate" | "Advanced" | "Pro";

export type Social = { label: string; url: string };

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  experience: Experience | null;
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
  created_at: string;
  updated_at: string;
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
  "Other",
] as const;
