# Baila — UI/UX Polish Pass

No runtime errors are currently reported and no routes are missing, so this is a visual/UX refinement pass only. Every existing feature, flow, query, and mutation stays exactly as-is.

## Design language (one shared system)

- Pastel blue (#A7C1E1) as primary, black as secondary, white/cream surfaces.
- Soft pastel-blue gradients, generous rounded corners (2xl/3xl), light layered shadows.
- Consistent spacing scale, one type scale (Syne display + DM Sans body), consistent icon sizes.
- Press-scale on every tappable element, fade+slide for popups, fast (150–250ms) natural easing.

## Shared components to add

A small primitive set in `src/components/ui-baila/` used across all screens so nothing looks hand-rolled anymore:

- `Button` (primary / secondary / ghost / danger, with press-scale)
- `Card` / `SectionCard` (rounded, soft shadow, consistent padding)
- `Field` + `Input` / `Textarea` / `Chip` (extracted from the existing edit-profile inputs)
- `Sheet`/`Dialog` shell with fade+slide animation
- `Skeleton` shimmer + `EmptyState` (icon, title, copy, CTA)
- `Toggle` switch with animated knob
- `PageTransition` wrapper for route enter animation

Existing screens get refactored to use these instead of one-off Tailwind strings.

## Per-screen work

**Landing + Auth** — centered logo, gradient wash, cleaner form fields and buttons.

**Dance feed** (`app.dance.tsx`, `DanceCard.tsx`) — true full-screen video, gradient scrim, refined profile overlay (name, headline, city, styles chips), floating circular action buttons with press feedback, smooth card cross-fade while scrolling, shimmer placeholder so a blank frame never shows, and a redesigned "Dance With Me" confirmation popup.

**Date / Connections** (`app.date.tsx`) — modern request cards with video thumbnail, clear status separation (Pending / Accepted / Completed / Declined) via segmented control and status pills, animated list transitions.

**Dance planner** (inside the Date tab) — location suggestion cards, cleaner date/time picker layout, calendar/ICS action styled as a proper card action.

**Profile** (`app.profile.tsx`) — premium header (cover + avatar overlap, name/username, bio, styles, experience, socials), stat cards, tighter video grid with rounded tiles and hover/press motion, upload progress animation, settings shortcut icon.

**Settings** (`app.settings.tsx`) — grouped rounded cards per section, animated toggles, better row spacing and readability.

**Onboarding, notifications, public profile, upload dialog, video player** — restyled to the same primitives, same content and steps.

## Technical notes

- Tokens and any new gradient/shadow variables added to `src/styles.css` under the existing `@theme inline` / `:root` blocks; no hardcoded color utilities in components.
- Animations use Tailwind/CSS keyframes already available (`fade-in`, `scale-in`, `accordion-*`) plus a few new `@utility` helpers — no new animation dependency.
- No changes to Supabase queries, mutations, RLS, routing structure, or route paths.
