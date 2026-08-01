# Baila — Platform Overhaul (Scope 4 / 5)

Touches all four priority areas while preserving the yellow/black design language. No messaging is introduced — the IRL-first philosophy stays.

## 1. Roles & data model

Add three roles: `dancer` (default), `instructor`, `organizer`.

Schema changes (single migration):
- `profiles.role` enum `('dancer','instructor','organizer')`, default `'dancer'`.
- `profiles.headline` text (one-liner under name).
- `profiles.availability` text[] (e.g. weeknights, weekends).
- `profiles.years_dancing` int.
- New table `public.events` (organizer-owned: title, style, city, venue, starts_at, cover_path, description). Read-all-authenticated; write-own + role check via `has_role`.
- New table `public.classes` (instructor-owned: title, style, level, city, recurrence, cover_path). Same policy shape.
- New table `public.notifications` (user_id, kind, payload jsonb, read_at). RLS: owner only.
- `connection_requests`: add `seen_at` for "new request" badge.
- GRANTs + RLS for every new table; security-definer `has_role(uuid, app_role)` helper.

## 2. Onboarding wizard

New route `/_authenticated/onboarding` gated by `profiles.onboarded = false`. 4 steps:
1. Pick role (dancer / instructor / organizer) with iconography.
2. Display name + username + city.
3. Dance styles (multi-select chips) + experience level + years.
4. Upload first dance video OR skip (dancers prompted, instructors/organizers optional).

App shell redirects to onboarding when incomplete.

## 3. Discovery feed upgrades

`app.dance.tsx`:
- Snap-scroll vertical feed with `<video>` IntersectionObserver autoplay (muted, playsInline), pause when off-screen.
- Preload next 2 signed URLs.
- Tap to mute/unmute; double-tap = Dance With Me; swipe left = Next.
- Recommendation ordering: prefer overlapping dance styles + same city, then recency, exclude self + already-actioned.
- Filter sheet: style, city, role.
- Skeleton + refined empty state with CTA to upload.
- Surface instructor/organizer badge + linked class/event chip on their cards.

## 4. Upload flow

`UploadVideoDialog.tsx`:
- Drag-drop zone, file validation (type, ≤100MB, ≤90s via metadata probe).
- Auto-generate poster from first frame via canvas; upload poster alongside video.
- Real progress (resumable `uploadToSignedUrl` with chunked fallback), retry on failure.
- Optional caption, style tag, set-as-main toggle.
- Queue multiple files; per-item status.

## 5. Connections (no chat)

`app.connections.tsx`:
- Three tabs: Requests / Dancing / Past.
- "Meet IRL" card replaces messaging: shows mutual styles, shared city, suggested local venues (static curated list per city for now), and an "Ice-breaker move" prompt (random from a curated list) — keeps philosophy intact.
- "Plan a dance" action drops a calendar `.ics` download with a placeholder time the user edits.
- Unseen-request badge on the bottom tab via `connection_requests.seen_at`.

## 6. Notifications

Lightweight bell in top bar:
- DB triggers insert notifications on: new request, mutual match, new class/event from instructors/organizers you've connected with.
- Realtime subscription on `notifications` for live badge.
- Notification list route `/_authenticated/app/notifications`.

## 7. Profile

`app.profile.tsx`:
- Role badge + headline + years dancing.
- Instructor view: "Classes" section. Organizer view: "Events" section. Both editable inline.
- Dancer view unchanged structurally, with availability chips added.
- Public read of others' profiles via `/_authenticated/app/u/$username`.

## 8. Search

New `/_authenticated/app/search` with tabs: Dancers / Classes / Events.
- Server-side `ilike` on display_name, username, styles, city.
- Empty state and recent-searches stored in localStorage.

## 9. Accessibility

- All icon-only buttons get `aria-label`.
- Replace `h-screen` with `h-dvh` in feed.
- Focus-visible rings on all interactive elements via Tailwind utility.
- Live-region (`role="status"`) for upload progress and toast equivalents.
- Verify color contrast on yellow-on-black CTAs (already AA, audit secondary text).
- Single `<main>` per route, proper heading order.

## 10. Performance

- Signed-URL cache TTL bump + LRU eviction in `src/lib/storage.ts`.
- `defaultPreloadStaleTime: 0` confirmed; route loaders prime via `ensureQueryData`.
- Lazy-load EditProfile / Upload dialogs with `React.lazy`.
- `<img>` wrappers use `aspect-*`; posters use `loading="lazy"` except first feed item.
- Memoize feed cards; virtualize connections list when > 30 rows.

## Technical notes

- Roles enforced via `public.has_role(_user_id uuid, _role app_role)` security-definer + RLS using it on `events`/`classes` writes.
- Notifications created by DB triggers on `connection_requests`, `classes`, `events` — no client-side fanout.
- Recommendation ranking runs as a `createServerFn` with `requireSupabaseAuth` returning a ranked array of `dance_videos` ids; client hydrates via existing query path.
- Onboarding redirect lives in `_authenticated/route.tsx` post-`getUser` check (one extra profile fetch, cached).
- All new tables ship with GRANTs + RLS + `service_role` ALL in the same migration.
- No new dependencies expected beyond what's already installed; if calendar export needs a helper, hand-roll the .ics string (no library).

## Out of scope (explicit)

- Any form of pre-match messaging or chat.
- Likes, comments, follower counts, stories.
- Push notifications (in-app bell only this pass).
- Payments / ticketing for events and classes.
