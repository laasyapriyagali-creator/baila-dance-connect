export type DanceClip = {
  id: string;
  poster: string;
  duration: string;
};

export type Dancer = {
  id: string;
  name: string;
  username: string;
  age: number;
  city: string;
  style: string;
  experience: "Beginner" | "Intermediate" | "Advanced" | "Pro";
  bio: string;
  avatar: string; // small profile photo, used only for identity
  poster: string; // main dance video thumbnail
  videos: DanceClip[]; // dance reel
};

const v = (poster: string, dur: string, i = 0): DanceClip => ({
  id: `${poster.slice(-12)}-${i}`,
  poster,
  duration: dur,
});

export const DANCERS: Dancer[] = [
  {
    id: "d1",
    name: "Mia",
    username: "miamoves",
    age: 24,
    city: "Barcelona",
    style: "Salsa",
    experience: "Advanced",
    bio: "Salsa on rooftops. Rumba in the kitchen.",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
    poster: "https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=900&q=80",
    videos: [
      v("https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=600&q=80", "0:22", 1),
      v("https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=600&q=80", "0:14", 2),
      v("https://images.unsplash.com/photo-1546484959-f9a381d1330d?auto=format&fit=crop&w=600&q=80", "0:38", 3),
    ],
  },
  {
    id: "d2",
    name: "Leo",
    username: "leo.bpm",
    age: 27,
    city: "Mexico City",
    style: "Hip-hop",
    experience: "Pro",
    bio: "Breaking since I was 12. Coffee then cyphers.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    poster: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=900&q=80",
    videos: [
      v("https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80", "0:31", 1),
      v("https://images.unsplash.com/photo-1516834474-48c0abc2a902?auto=format&fit=crop&w=600&q=80", "0:18", 2),
    ],
  },
  {
    id: "d3",
    name: "Yuna",
    username: "yuna.kpop",
    age: 22,
    city: "Seoul",
    style: "K-pop",
    experience: "Advanced",
    bio: "Choreo nerd. Mirror selfies are out, mirror moves are in.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    poster: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=900&q=80",
    videos: [
      v("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80", "0:27", 1),
      v("https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=600&q=80", "0:19", 2),
      v("https://images.unsplash.com/photo-1485872299712-c3edf30a8d31?auto=format&fit=crop&w=600&q=80", "0:11", 3),
    ],
  },
  {
    id: "d4",
    name: "Aïcha",
    username: "aicha.flow",
    age: 26,
    city: "Paris",
    style: "Freestyle",
    experience: "Intermediate",
    bio: "Movement is my mother tongue.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    poster: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80",
    videos: [
      v("https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=600&q=80", "0:24", 1),
    ],
  },
  {
    id: "d5",
    name: "Marco",
    username: "marco.classical",
    age: 29,
    city: "Rome",
    style: "Classical",
    experience: "Pro",
    bio: "Ballet by training, jazz by heart.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80",
    poster: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=900&q=80",
    videos: [
      v("https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=600&q=80", "0:42", 1),
      v("https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?auto=format&fit=crop&w=600&q=80", "0:33", 2),
    ],
  },
  {
    id: "d6",
    name: "Sana",
    username: "sana.lisboa",
    age: 23,
    city: "Lisbon",
    style: "Freestyle",
    experience: "Intermediate",
    bio: "Beach, beat, repeat.",
    avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=200&q=80",
    poster: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=900&q=80",
    videos: [
      v("https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=600&q=80", "0:17", 1),
    ],
  },
  {
    id: "d7",
    name: "Diego",
    username: "diego.tango",
    age: 28,
    city: "Buenos Aires",
    style: "Salsa",
    experience: "Advanced",
    bio: "Tango at midnight, salsa at sunrise.",
    avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=80",
    poster: "https://images.unsplash.com/photo-1546484959-f9a381d1330d?auto=format&fit=crop&w=900&q=80",
    videos: [
      v("https://images.unsplash.com/photo-1546484959-f9a381d1330d?auto=format&fit=crop&w=600&q=80", "0:29", 1),
      v("https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=600&q=80", "0:21", 2),
    ],
  },
  {
    id: "d8",
    name: "Noa",
    username: "noa.tlv",
    age: 25,
    city: "Tel Aviv",
    style: "Hip-hop",
    experience: "Advanced",
    bio: "Street cyphers + studio drills.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    poster: "https://images.unsplash.com/photo-1516834474-48c0abc2a902?auto=format&fit=crop&w=900&q=80",
    videos: [
      v("https://images.unsplash.com/photo-1516834474-48c0abc2a902?auto=format&fit=crop&w=600&q=80", "0:25", 1),
      v("https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80", "0:14", 2),
    ],
  },
];

export const DANCE_STYLES = [
  "Freestyle",
  "Hip-hop",
  "K-pop",
  "Salsa",
  "Classical",
  "Other",
] as const;
