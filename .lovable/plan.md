# Baila — Settings, Privacy & Safety

Your sketch confirms the shape the app already has: Dance feed → dancer profile → "Dance with [name]" yes/no → match → Your Dates (Sent / Received / Accepted / Completed) → "Go again?", plus a Profile tab with avatar, Dances/Dates counters, name-age-location, bio, video grid + upload, and a **gear icon top-right**. That gear is the only thing in the sketch that does not exist today — everything below is about filling it.

## Where Settings lives

- Gear icon in the top-right of the Profile tab.
- Opens a full-screen Settings screen (its own page, not a modal), with a back arrow. Grouped list rows, same pastel-blue/black tokens, no new palette.
- Sub-screens for each long section (Privacy, Safety, Legal), so the top level stays scannable.

## Settings structure (approximate, based on how Tinder/Bumble/Hinge organise this)

**Account**
- Name, age, location, bio (jumps to profile edit)
- Phone / email on file (later, when accounts return)
- Log out
- Pause account — hide me from the Dance feed but keep my dates
- Delete account + all my videos (irreversible, confirm step)

**Discovery**
- Dance styles I want to see
- Distance radius
- Age range
- Show me to: everyone / only people I've asked to dance
- Reset "passed" dancers

**Privacy**
- Hide my age
- Hide my exact location (show city only)
- Who can see my videos: everyone in feed / only matches
- Allow my videos to be shown as a featured dancer
- Download my data
- Personalised content / analytics opt-out

**Safety** (the part dating apps treat as non-negotiable)
- Blocked dancers list (unblock)
- Report a dancer / report a video — reason list, sends out of the app, never a public comment
- Share my date details with a trusted contact (name + phone, one tap before a date)
- Date safety checklist shown before every first meet (public place, tell a friend, your own transport)
- Emergency contact stored locally
- Photo/ID verification badge (needs a backend; stub the row now, mark "coming soon" or leave out)
- Explicit-content auto-blur on incoming videos

**Notifications**
- New dance invite
- Invite accepted / declined
- Date reminder (1 day / 2 hours before)
- "Go again?" requests
- Master mute

**Legal & community**
- Community Guidelines — dance-first conduct: real movement only, no nudity, no stolen videos, no minors, no harassment, respect a "no", show up or cancel early
- Terms of Service
- Privacy Policy
- Cookie/analytics notice
- Safety Centre / dating safety tips
- Contact support, report a bug
- App version

## Honest constraints

- The app is currently local-only (localStorage + IndexedDB, no sign-up). So Blocked list, Report, Verification, and Download-my-data can be built as real UI but only have local effect until accounts and a backend come back. I'll label those rows accurately rather than faking outcomes.
- Terms, Privacy Policy and Guidelines pages will be written as your own app-owned text. I will not claim GDPR/SOC 2 compliance, encryption levels, or verification you don't actually have — anything legal-binding, I'll leave clear placeholders for you to fill or approve.

## Technical notes

- New route `src/routes/settings.tsx` (plus nested privacy/safety/legal screens), navigated from the Profile gear.
- Extend `src/lib/baila-local.ts` with a `settings` slice (discovery filters, privacy toggles, notification prefs, blocked ids, emergency contact) persisted under the same `baila.mvp.v1` key, exposed via existing `useBaila()`.
- `DanceFeed.tsx` reads discovery + blocked settings when filtering reels; `ProfilePanel.tsx` respects hide-age / city-only.
- Legal pages as plain JSX text, own routes, linked from Settings and reachable directly.
