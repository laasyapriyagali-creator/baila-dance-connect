// Baila MVP store — fully local, no account needed.
// Metadata lives in localStorage; video blobs live in IndexedDB so reels
// survive reloads and can be played back offline.

export type Experience = "Beginner" | "Intermediate" | "Advanced" | "Pro";

export type LocalProfile = {
  name: string;
  age: number | null;
  city: string;
  bio: string;
  styles: string[];
  experience: Experience;
  avatar: string | null; // data URL
};


export type Reel = {
  id: string;
  dancer: string;
  style: string;
  caption: string;
  poster: string | null; // data URL
  duration: number;
  createdAt: string;
};

export type DanceDate = {
  id: string;
  reelId: string;
  dancer: string;
  status: "invited" | "planned";
  when: string | null;
  place: string;
  note: string;
  createdAt: string;
};

export type BailaSettings = {
  paused: boolean;
  discovery: {
    styles: string[];
    radiusKm: number;
    ageMin: number;
    ageMax: number;
    visibleTo: "everyone" | "invited";
  };
  privacy: {
    hideAge: boolean;
    cityOnly: boolean;
    reelsVisibleTo: "everyone" | "matches";
    featured: boolean;
    analytics: boolean;
  };
  safety: {
    blurExplicit: boolean;
    safetyChecklist: boolean;
    shareDate: boolean;
    emergencyName: string;
    emergencyPhone: string;
  };
  notifications: {
    muteAll: boolean;
    invites: boolean;
    responses: boolean;
    reminders: boolean;
    goAgain: boolean;
  };
};

export type BailaState = {
  profile: LocalProfile;
  reels: Reel[];
  dates: DanceDate[];
  passed: string[];
  blocked: string[]; // dancer names blocked on this device
  settings: BailaSettings;
};

export const DEFAULT_SETTINGS: BailaSettings = {
  paused: false,
  discovery: { styles: [], radiusKm: 25, ageMin: 18, ageMax: 60, visibleTo: "everyone" },
  privacy: {
    hideAge: false,
    cityOnly: true,
    reelsVisibleTo: "everyone",
    featured: true,
    analytics: false,
  },
  safety: {
    blurExplicit: true,
    safetyChecklist: true,
    shareDate: false,
    emergencyName: "",
    emergencyPhone: "",
  },
  notifications: { muteAll: false, invites: true, responses: true, reminders: true, goAgain: true },
};


export const DANCE_STYLES = [
  "Freestyle",
  "Hip-hop",
  "Salsa",
  "Bachata",
  "Afrobeat",
  "House",
  "Contemporary",
  "Kizomba",
  "Tango",
  "K-pop",
] as const;

export const EXPERIENCES: Experience[] = ["Beginner", "Intermediate", "Advanced", "Pro"];

export const ICE_BREAKERS = [
  "Trade your favourite 4-count groove",
  "Mirror each other for 30 seconds — no leading",
  "Pick a song neither of you has danced to before",
  "Freestyle to silence, then add the music",
];

const KEY = "baila.mvp.v1";

const EMPTY: BailaState = {
  profile: { name: "", city: "", bio: "", styles: [], experience: "Beginner", avatar: null },
  reels: [],
  dates: [],
  passed: [],
};

let state: BailaState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load(): BailaState {
  if (loaded) return state;
  loaded = true;
  if (typeof window === "undefined") return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as BailaState) };
  } catch {
    state = EMPTY;
  }
  return state;
}

function commit(next: BailaState) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage full — keep in-memory copy
    }
  }
  listeners.forEach((l) => l());
}

export const bailaStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get(): BailaState {
    return load();
  },
  getServer(): BailaState {
    return EMPTY;
  },
  saveProfile(patch: Partial<LocalProfile>) {
    const s = load();
    commit({ ...s, profile: { ...s.profile, ...patch } });
  },
  addReel(reel: Reel) {
    const s = load();
    commit({ ...s, reels: [reel, ...s.reels] });
  },
  removeReel(id: string) {
    const s = load();
    commit({
      ...s,
      reels: s.reels.filter((r) => r.id !== id),
      dates: s.dates.filter((d) => d.reelId !== id),
    });
    void deleteVideo(id);
  },
  pass(id: string) {
    const s = load();
    if (s.passed.includes(id)) return;
    commit({ ...s, passed: [...s.passed, id] });
  },
  resetPassed() {
    commit({ ...load(), passed: [] });
  },
  inviteToDance(reel: Reel) {
    const s = load();
    if (s.dates.some((d) => d.reelId === reel.id)) return;
    const date: DanceDate = {
      id: crypto.randomUUID(),
      reelId: reel.id,
      dancer: reel.dancer,
      status: "invited",
      when: null,
      place: "",
      note: "",
      createdAt: new Date().toISOString(),
    };
    commit({ ...s, dates: [date, ...s.dates] });
  },
  updateDate(id: string, patch: Partial<DanceDate>) {
    const s = load();
    commit({
      ...s,
      dates: s.dates.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  },
  removeDate(id: string) {
    const s = load();
    commit({ ...s, dates: s.dates.filter((d) => d.id !== id) });
  },
};

/* ---------- IndexedDB video blobs ---------- */

const DB_NAME = "baila-media";
const STORE = "videos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putVideo(id: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function deleteVideo(id: string) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
    const url = urlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urlCache.delete(id);
    }
  } catch {
    // noop
  }
}

const urlCache = new Map<string, string>();

export async function getVideoUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(id, url);
    return url;
  } catch {
    return null;
  }
}
