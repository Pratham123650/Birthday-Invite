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

revoke all on table public.rsvps from anon, authenticated;
grant insert on table public.rsvps to anon, authenticated;

drop policy if exists "Guests can submit RSVPs" on public.rsvps;
create policy "Guests can submit RSVPs"
on public.rsvps
for insert
to anon, authenticated
with check (
  char_length(first_name) between 1 and 80
  and char_length(last_name) between 1 and 80
  and party_size between 0 and 12
  and jsonb_typeof(additional_guests) = 'array'
  and jsonb_array_length(additional_guests) <= 11
  and char_length(dietary_restrictions) <= 600
  and char_length(message) <= 1200
  and ((attending and party_size >= 1) or (not attending and party_size = 0))
);

-- Guests can submit a response, but anonymous and signed-in browser clients
-- cannot read, update, or delete any RSVP rows.

create index if not exists rsvps_submitted_at_idx
  on public.rsvps (submitted_at desc);
