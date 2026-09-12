# Sureshchandra at 75

A mobile-first birthday invitation and RSVP experience for Sureshchandra’s 75th birthday on September 20, 2026 at 11:30 AM.

## Event details

All guest-facing event content is centralized in `lib/event.ts`. The seven approved RSVP names are centralized in `lib/guests.ts` and mirrored in the database migration.

## RSVP setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Set the admin password using the separate SQL statement documented at the bottom of that file. Do not commit the plaintext password.
3. Copy `.env.example` to `.env.local` and add the public Supabase URL and publishable key.
4. For server deployments, also set `SUPABASE_URL`, the server-only service-role key, `ADMIN_PASSWORD`, and a random `SESSION_SECRET` of at least 32 characters.

The service-role key is used only in server routes and is never sent to the browser. RSVP rows have row-level security enabled and cannot be read directly by anonymous visitors.

For GitHub Pages, the invitation uses the project's public Supabase URL and publishable key. Guests can only call narrowly scoped RSVP functions: approved-name validation and duplicate updates happen inside PostgreSQL, while anonymous table reads and writes remain blocked. Set the repository variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; every push to `main` then publishes the invitation and password-protected `/admin/` dashboard automatically.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds a static export at `/Birthday-Invite/` and publishes it with GitHub Pages. Server-only API routes are excluded from the export; RSVP submission and the admin dashboard use the validated Supabase RPC functions.

## Local development

Run `npm install`, then `npm run dev`. The private guest-list dashboard is at `/admin`.

The cake and guided introduction replay on every full page load. Append `?intro=1` while developing or testing to make the replay intent explicit without clearing browser storage.
