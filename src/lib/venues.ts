export type VenueIdea = { name: string; vibe: string };

type StyleGroup = "social" | "studio" | "outdoor";

const SOCIAL_STYLES = ["salsa", "bachata", "kizomba", "tango", "afrobeat"];
const STUDIO_STYLES = ["hip-hop", "hip hop", "house", "k-pop", "kpop", "classical"];
const OUTDOOR_STYLES = ["freestyle", "contemporary", "other"];

function groupFor(style: string): StyleGroup {
  const s = style.toLowerCase();
  if (SOCIAL_STYLES.some((x) => s.includes(x))) return "social";
  if (STUDIO_STYLES.some((x) => s.includes(x))) return "studio";
  return "outdoor";
}

const TEMPLATES: Record<StyleGroup, (city?: string | null) => VenueIdea[]> = {
  social: (city) => [
    { name: "Salsa social night", vibe: city ? `Open floor social in ${city}` : "Open floor social, live DJ" },
    { name: "Bachata sensual mixer", vibe: "Beginner-friendly, no partner needed" },
    { name: "Kizomba lounge session", vibe: "Low light, close connection, easy pace" },
    { name: "Latin dance café meetup", vibe: city ? `Casual social in ${city}` : "Casual coffee-shop social" },
  ],
  studio: (city) => [
    { name: "Open-floor studio hour", vibe: city ? `Drop-in studio in ${city}` : "Mirrors, speakers, drop-in rate" },
    { name: "Practice room session", vibe: "Book a room, bring your own playlist" },
    { name: "Hip-hop cypher jam", vibe: "Casual freestyle circle, all levels" },
    { name: "House music workshop drop-in", vibe: "Groove-focused, beginner friendly" },
  ],
  outdoor: (city) => [
    { name: "Riverside park session", vibe: city ? `Open-air spot near ${city}` : "Grass, speaker, good light" },
    { name: "Beachfront freestyle sunset", vibe: "Sand underfoot, golden hour" },
    { name: "Plaza pop-up dance", vibe: "Public square, easygoing energy" },
    { name: "Rooftop contemporary session", vibe: city ? `Skyline views over ${city}` : "Skyline views, quiet evening" },
  ],
};

/** Suggests up to 6 generic venue ideas based on the pair's shared dance styles. */
export function suggestVenues(styles: string[], city?: string | null): VenueIdea[] {
  const groups = new Set<StyleGroup>(styles.length ? styles.map(groupFor) : ["social", "studio", "outdoor"]);
  const ideas: VenueIdea[] = [];
  for (const g of groups) {
    ideas.push(...TEMPLATES[g](city));
  }
  if (ideas.length === 0) {
    ideas.push(...TEMPLATES.social(city), ...TEMPLATES.studio(city));
  }
  // de-dupe by name, cap at 6
  const seen = new Set<string>();
  const out: VenueIdea[] = [];
  for (const idea of ideas) {
    if (seen.has(idea.name)) continue;
    seen.add(idea.name);
    out.push(idea);
    if (out.length === 6) break;
  }
  return out;
}
