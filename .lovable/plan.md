# Baila — Enter without signing in

Goal: opening Baila drops you straight into the Dance feed as a real, populated user. No sign-in screen, no email, no password — but the real backend, storage, video pipeline, request logic and RLS all keep working exactly as they do today.

Nothing is rebuilt. Auth/session handling and a demo-seeding layer are the only new pieces, and both are easy to switch off later.

## 1. Guest session (per visitor)

- The app opens straight into `/app/dance`. If there is no session, it silently starts a **guest session** in the backend (anonymous session support enabled) — each visitor gets their own private session, so one person's skips and requests never leak into another's.
- No sign-in screen, no "login required" state, no email/password, no Google button on entry.
- Because the guest is a genuine backend session, every existing feature keeps working untouched: dance requests, skips, blocks, settings, dance dates, notifications, signed video URLs.
- Guest sessions are throwaway. A short scheduled cleanup removes guest data older than a few days so the database doesn't fill up.

## 2. The guest's identity: Lily

The first time a guest session starts, the app provisions that guest as a believable Baila member:

- Name **Lily**, a username, city, dance styles, short headline, profile photo.
- **3 dance videos** on her profile, playing real clips through the existing video infrastructure.
- **7 dance dates** as her profile stat.
- Existing connection history: a couple of accepted matches, one waiting request, one confirmed dance date with a venue and time.

All of it is real rows created through the normal models — so the Connects and Profile tabs read live data, not hardcoded screens.

## 3. A populated dance floor

A one-time seed adds a small cast of **real-feeling dancers** (names, cities, ages, styles, headlines, avatars) whose main videos reuse the dance clips already in storage. They exist once in the database and every guest discovers the same cast, so the feed is never empty and never shows fake labels.

Some of them are pre-wired into Lily's connection history so Connects looks lived-in from the first second.

## 4. Core loop stays as built

Unchanged behaviour, just reachable instantly:

```text
open Baila -> watch a dance -> Dance with me / Next
  -> confirm sheet -> "dance request sent"
  -> Connects: waiting / accepted / confirmed + dance again
  -> match -> Baila suggests a place to meet IRL (or pick one)
  -> decline -> back to scrolling
```

Small polish only, no new features:
- Confirm sheet wording matches the requested tone ("Would you like to dance with this person?" / yes / nah) and success reads "dance request sent 💃".
- Green "Dance with <name>" / red "Next" labels on the feed actions.
- To make an accepted match reachable in a demo, one seeded dancer accepts shortly after a request so the IRL planner is experienceable end to end.

## 5. Three tabs

Dance (default) · Connections · Profile — exactly as today, instant switching, video dominating the Dance screen. No chat anywhere.

## 6. Profile & sign-up later

Profile shows photo, **Lily**, **7 dance dates**, then **My dances** with her videos, plus Edit profile / My dances / Privacy / Settings entries that behave as they do now.

At the bottom of Profile (and inside Settings' account section) a soft, non-blocking prompt: *"ready to find your dance date?"* → opens the existing sign-in screen. No popups, no interruptions, no forced sign-up.

## Technical notes

- Enable anonymous sessions in auth config; `src/lib/auth.ts` gains a guest bootstrap that calls `signInAnonymously()` when no session exists. `_authenticated/route.tsx` waits for that instead of redirecting to `/auth`; `/auth` stays as a route for the later conversion path.
- `src/routes/index.tsx` redirects into `/app/dance` rather than showing the landing CTA (landing kept in code, unused).
- New `ensureGuestProfile` server function (authenticated, runs once per guest) writes the Lily profile, her `dance_videos` rows (reusing existing `dance-videos` storage paths), `user_settings`, and her seeded `connection_requests` / `dance_dates`.
- Demo dancer cast is created once via a guarded admin-side seed (auth users + `profiles` + `dance_videos` rows pointing at existing storage objects) — not on page load, and not re-created per visitor.
- Onboarding gate in `_authenticated/app.tsx` is satisfied by the provisioned profile (`onboarded: true`), so guests never see the onboarding wizard.
- A `guest` flag on the profile keeps demo rows identifiable for cleanup and makes reverting to normal auth a matter of flipping the bootstrap off.
- No changes to RLS posture, storage buckets, matching logic, or existing components beyond the copy/label tweaks above.
