# Sureshchandra at 75

A mobile-first birthday invitation and RSVP experience for Sureshchandra’s 75th birthday on September 20, 2026 at 11:30 AM.

## Event details

All guest-facing event content is centralized in `lib/event.ts`. Replace the venue, address, parking, contact, dress code, and maps URL there when those details are confirmed.

## RSVP setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Copy `.env.example` to `.env.local`.
3. Set `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY`.
4. Set a strong `ADMIN_PASSWORD` and a random `SESSION_SECRET` of at least 32 characters.

The service-role key is used only in server routes and is never sent to the browser. RSVP rows have row-level security enabled and cannot be read directly by anonymous visitors.

For GitHub Pages, the invitation uses the project's public Supabase URL and publishable key. Row-level security permits RSVP inserts while blocking anonymous reads, updates, and deletes. Set the repository variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; every push to `main` then publishes the site automatically.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds a static export at `/Birthday-Invite/` and publishes it with GitHub Pages. Server-only routes and the private admin page remain available only on a server-capable deployment; responses can always be viewed securely in the Supabase dashboard.

## Local development

Run `npm install`, then `npm run dev`. The private guest-list dashboard is at `/admin`.
