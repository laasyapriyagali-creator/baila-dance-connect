import { create } from "zustand";
import { DANCERS, type Dancer } from "@/data/dancers";

export type ConnectionStatus = "pending_in" | "pending_out" | "active" | "past";

export type Connection = {
  id: string;
  dancer: Dancer;
  status: ConnectionStatus;
  createdAt: number;
  danceAgain?: boolean;
};

export type ProfileVideo = {
  id: string;
  title: string;
  duration: string;
  poster: string;
  isMain: boolean;
};

export type UserProfile = {
  name: string;
  username: string;
  age: number;
  city: string;
  bio: string;
  experience: "Beginner" | "Intermediate" | "Advanced" | "Pro";
  avatar: string;
  cover: string;
  socials: { label: string; url: string }[];
  followers: number;
  following: number;
};

type State = {
  index: number;
  next: () => void;
  sendRequest: (dancerId: string) => void;

  connections: Connection[];
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  toggleDanceAgain: (id: string) => void;

  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;

  styles: string[];
  toggleStyle: (s: string) => void;

  videos: ProfileVideo[];
  addVideo: (v: Omit<ProfileVideo, "isMain" | "id"> & { id?: string }) => void;
  removeVideo: (id: string) => void;
  setMainVideo: (id: string) => void;
  moveVideo: (id: string, dir: -1 | 1) => void;
};

const seedConnections: Connection[] = [
  { id: "c1", dancer: DANCERS[2], status: "pending_in", createdAt: Date.now() - 3600_000 },
  { id: "c2", dancer: DANCERS[4], status: "pending_in", createdAt: Date.now() - 7200_000 },
  { id: "c3", dancer: DANCERS[6], status: "active", createdAt: Date.now() - 86400_000 },
  { id: "c4", dancer: DANCERS[1], status: "past", createdAt: Date.now() - 5 * 86400_000, danceAgain: true },
];

const seedVideos: ProfileVideo[] = [
  {
    id: "v1",
    title: "Friday freestyle",
    duration: "0:24",
    poster:
      "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?auto=format&fit=crop&w=600&q=80",
    isMain: true,
  },
  {
    id: "v2",
    title: "Kitchen groove",
    duration: "0:12",
    poster:
      "https://images.unsplash.com/photo-1485872299712-c3edf30a8d31?auto=format&fit=crop&w=600&q=80",
    isMain: false,
  },
  {
    id: "v3",
    title: "Studio reel",
    duration: "0:34",
    poster:
      "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=600&q=80",
    isMain: false,
  },
];

const seedProfile: UserProfile = {
  name: "Alex",
  username: "alex.moves",
  age: 26,
  city: "Madrid",
  bio: "Freestyle + salsa. Dancing is how I say hello.",
  experience: "Intermediate",
  avatar:
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
  cover:
    "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?auto=format&fit=crop&w=1200&q=80",
  socials: [
    { label: "Instagram", url: "https://instagram.com/alex.moves" },
  ],
  followers: 248,
  following: 132,
};

export const useBaila = create<State>((set) => ({
  index: 0,
  next: () => set((s) => ({ index: (s.index + 1) % DANCERS.length })),
  sendRequest: (dancerId) =>
    set((s) => {
      const dancer = DANCERS.find((d) => d.id === dancerId);
      if (!dancer) return s;
      if (s.connections.some((c) => c.dancer.id === dancerId)) return s;
      return {
        connections: [
          { id: `out-${dancerId}`, dancer, status: "pending_out", createdAt: Date.now() },
          ...s.connections,
        ],
      };
    }),

  connections: seedConnections,
  acceptRequest: (id) =>
    set((s) => ({
      connections: s.connections.map((c) =>
        c.id === id ? { ...c, status: "active" as ConnectionStatus } : c,
      ),
    })),
  declineRequest: (id) =>
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) })),
  toggleDanceAgain: (id) =>
    set((s) => ({
      connections: s.connections.map((c) =>
        c.id === id ? { ...c, danceAgain: !c.danceAgain } : c,
      ),
    })),

  profile: seedProfile,
  updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

  styles: ["Freestyle", "Salsa"],
  toggleStyle: (s) =>
    set((state) => ({
      styles: state.styles.includes(s)
        ? state.styles.filter((x) => x !== s)
        : [...state.styles, s],
    })),

  videos: seedVideos,
  addVideo: (v) =>
    set((s) => {
      const id = v.id ?? `v${Date.now()}`;
      const isMain = s.videos.length === 0;
      return { videos: [...s.videos, { ...v, id, isMain }] };
    }),
  removeVideo: (id) =>
    set((s) => {
      const filtered = s.videos.filter((v) => v.id !== id);
      if (filtered.length && !filtered.some((v) => v.isMain)) filtered[0].isMain = true;
      return { videos: filtered };
    }),
  setMainVideo: (id) =>
    set((s) => ({ videos: s.videos.map((v) => ({ ...v, isMain: v.id === id })) })),
  moveVideo: (id, dir) =>
    set((s) => {
      const i = s.videos.findIndex((v) => v.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.videos.length) return s;
      const arr = [...s.videos];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { videos: arr };
    }),
}));
