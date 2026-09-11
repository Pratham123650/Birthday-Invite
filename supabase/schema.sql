create extension if not exists pgcrypto;

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  attending boolean not null,
  party_size integer not null default 0 check (party_size between 0 and 12),
  additional_guests jsonb not null default '[]'::jsonb,
  dietary_restrictions text not null default '',
  message text not null default '',
  submitted_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- The browser never talks directly to this table. All reads and writes pass
-- through server routes using the Supabase service-role key.
revoke all on table public.rsvps from anon, authenticated;

create index if not exists rsvps_submitted_at_idx
  on public.rsvps (submitted_at desc);
