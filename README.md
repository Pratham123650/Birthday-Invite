# Sureshchandra at 75

A mobile-first birthday invitation and RSVP experience for Sureshchandra’s 75th birthday on September 20, 2026 at 11:30 AM.

## Event details

All guest-facing event content is centralized in `lib/event.ts`. The seven approved RSVP names are centralized in `lib/guests.ts` and mirrored in the database migration.

## RSVP setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Set the admin password using the separate SQL statement documented at the bottom of that file. Do not commit the plaintext password.
3. Copy `.env.example` to `.env.local` and add the Supabase URL and publishable key for both the server RSVP route and browser-based admin dashboard.

RSVP rows have row-level security enabled and cannot be read directly by anonymous visitors. Guests can only call a narrowly scoped database function that validates the approved-name list and safely creates or updates one household response. The password-protected admin dashboard calls a separate read-only database function.

## Deployment

The production site is hosted on Vercel at `https://birthday-celebration-75.vercel.app`. Vercel is connected to the GitHub repository, and each push to `main` automatically creates a production deployment.

Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production and Preview in Vercel. The GitHub repository remains the source of truth; the former GitHub Pages workflow has been retired now that Vercel is live.

## Local development

Run `npm install`, then `npm run dev`. The private guest-list dashboard is at `/admin`.

The cake and guided introduction replay on every full page load. Append `?intro=1` while developing or testing to make the replay intent explicit without clearing browser storage.
