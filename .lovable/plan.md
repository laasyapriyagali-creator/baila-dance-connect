ns# Baila — MVP Plan

A mobile-first dance-discovery app with a bold yellow & black identity. This first pass builds the full UI shell with realistic mock data so you can feel the entire flow. Auth, video uploads, and matching persistence can be wired to Lovable Cloud in a follow-up once the look and feel is locked.

## Scope of this pass

In:
- Brand system (yellow primary, black contrast, playful modern type)
- Onboarding / welcome screen (redesigned per your spec)
- Dance feed (full-screen vertical video, Next / Dance With Me, confirm popup)
- Connections (pending, active, past, Dance Again)
- Profile (large "My Dance Videos" section, photo, styles, basic info, settings)
- Logo asset wired in from your upload
- Mock dancer + connection data so every screen is alive

Deferred to a follow-up turn (will require Lovable Cloud):
- Real signup (Google / Apple / Email), profile creation flow
- Real video upload + storage, main-video selection persistence
- Real request / accept / decline / Dance Again persistence

## Brand & design system

- Primary: bright Baila yellow (`#FFD60A`-ish in oklch), background mostly yellow or warm off-white — never dark-mode-heavy
- Contrast: near-black for text, surfaces, icons
- Accents: orange for "Next", green for "Dance With Me"
- Type: friendly modern pair (display: Syne or Sora; body: DM Sans / Manrope) — not all-caps, human feel
- Rounded-2xl buttons, generous whitespace, large tap targets, subtle motion
- Tokens defined in `src/styles.css` under `@theme inline` + `:root` (oklch). No hardcoded colors in components.

## Screen-by-screen

### 1. Onboarding `/`
- Centered logo (from uploaded asset) on yellow background
- Wordmark "Baila" in elegant display type, not all caps
- Tagline: "Dance to connect"
- Large rounded black (or deep ink) CTA: "Find Your Rhythm"
- Small secondary line: "Discover people through dance."
- Minimal, no feature bullets, no marketing blocks

### 2. App shell `/app`
- Layout route with sticky bottom tab bar (3 tabs only): Dance, Connections, Profile
- Tab bar uses yellow surface with black active indicator; custom icons (lucide: Music2 / Sparkles / User)

### 3. Dance `/app/dance`
- Full-screen vertical video card (mock video poster + looping clip)
- Overlaid info: name, age, city, dance style chip
- Bottom action row: round orange "Next" (skip) + round green "Dance With Me"
- Tap / swipe (simple swipe handler) advances to next dancer
- Tapping "Dance With Me" opens confirm dialog: "Would you like to dance with this person?" Yes / No
- Toast confirmation on Yes; advances feed

### 4. Connections `/app/connections`
- Segmented tabs: Pending · Active · Past
- Pending: incoming requests with Accept / Decline
- Active: connected dancers with "View profile" and "⭐ Dance Again"
- Past: inactive connections, option to mark Dance Again
- Empty states with playful copy

### 5. Profile `/app/profile`
- Compact header: profile photo + name + city (small)
- HERO section "My Dance Videos" (largest block on screen):
  - Prominent "Upload Dance Video" button (mock — opens dialog, simulated progress bar, adds to grid)
  - 2-col card grid of videos with duration badge, "Main" star, kebab menu (Set as main / Replace / Delete / Preview)
  - Reorder via simple up/down buttons in menu (drag-and-drop deferred)
- Dance styles chips (Freestyle, Hip-hop, K-pop, Salsa, Classical, Other) — toggleable
- Basic info: age, gender, interested in (Dance Partner / Friends / Dates / Open to all)
- Settings list at bottom (Account, Notifications, Privacy, Sign out — stubs)

## Mock data & state

- `src/data/dancers.ts` — 8 mock dancers (name, age, city, style, poster img, video url placeholder)
- `src/data/connections.ts` — sample pending/active/past
- Local React state + `zustand` (lightweight) for: current dance index, sent requests, connections, profile videos & main video selection
- All persistence in-memory for now; structure makes it easy to swap to Cloud

## File plan

- `src/styles.css` — replace tokens with Baila palette + register fonts via `<link>` in `__root.tsx`
- `src/routes/__root.tsx` — add font `<link>` tags, update meta (title "Baila — Dance to connect")
- `src/routes/index.tsx` — onboarding screen
- `src/routes/app.tsx` — layout route with bottom tab bar + `<Outlet />`
- `src/routes/app.dance.tsx`
- `src/routes/app.connections.tsx`
- `src/routes/app.profile.tsx`
- `src/components/baila/` — `BottomTabs`, `DanceCard`, `ActionButtons`, `ConfirmDanceDialog`, `ConnectionRow`, `VideoCard`, `UploadVideoDialog`, `StyleChips`, `Logo`
- `src/data/dancers.ts`, `src/data/connections.ts`
- `src/store/baila.ts` — zustand store
- `src/assets/baila-logo.png.asset.json` — Lovable Asset pointer for uploaded logo

## Technical notes

- TanStack Start file-based routes; flat dot naming (`app.dance.tsx` etc.)
- Each route sets its own `head()` with unique title/description
- Bottom tabs use `<Link>` from `@tanstack/react-router` with `activeProps`
- Videos use `<video muted playsInline loop autoPlay>` with poster; mock urls (sample short MP4s from a public CDN or just animated posters if videos fail)
- Confirm dialog uses existing shadcn `AlertDialog`
- Use `framer-motion` for tab transitions and the swipe gesture on the dance card (already common; install if missing)

## Open questions

1. OK to ship this UI-first pass with mock data, then enable Lovable Cloud next turn for real auth + uploads?
2. Should the bottom tab labels read "Connections" or your earlier "Dates"? Spec uses both — I'll go with "Connections" to match the detailed flow unless you say otherwise.
