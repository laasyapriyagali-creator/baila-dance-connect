export type Dancer = {
  id: string;
  name: string;
  age: number;
  city: string;
  style: string;
  poster: string;
  video?: string;
};

// Posters use Unsplash; videos are short looping samples from coverr/mixkit-style placeholders.
export const DANCERS: Dancer[] = [
  {
    id: "d1",
    name: "Mia",
    age: 24,
    city: "Barcelona",
    style: "Salsa",
    poster:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "d2",
    name: "Leo",
    age: 27,
    city: "Mexico City",
    style: "Hip-hop",
    poster:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "d3",
    name: "Yuna",
    age: 22,
    city: "Seoul",
    style: "K-pop",
    poster:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "d4",
    name: "Aïcha",
    age: 26,
    city: "Paris",
    style: "Freestyle",
    poster:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "d5",
    name: "Marco",
    age: 29,
    city: "Rome",
    style: "Classical",
    poster:
      "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "d6",
    name: "Sana",
    age: 23,
    city: "Lisbon",
    style: "Freestyle",
    poster:
      "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "d7",
    name: "Diego",
    age: 28,
    city: "Buenos Aires",
    style: "Salsa",
    poster:
      "https://images.unsplash.com/photo-1546484959-f9a381d1330d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "d8",
    name: "Noa",
    age: 25,
    city: "Tel Aviv",
    style: "Hip-hop",
    poster:
      "https://images.unsplash.com/photo-1516834474-48c0abc2a902?auto=format&fit=crop&w=900&q=80",
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
