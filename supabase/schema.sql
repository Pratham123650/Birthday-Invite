create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.approved_guests (
  guest_key text primary key,
  full_name text not null unique,
  first_name text not null,
  last_name text not null,
  display_order integer not null unique
);

insert into public.approved_guests (guest_key, full_name, first_name, last_name, display_order)
values
  ('mahesh-patel', 'Mahesh Patel', 'Mahesh', 'Patel', 1),
  ('vacant-patel', 'Vacant Patel', 'Vacant', 'Patel', 2),
  ('kavita-desai', 'Kavita Desai', 'Kavita', 'Desai', 3),
  ('jagdish-patel', 'Jagdish Patel', 'Jagdish', 'Patel', 4),
  ('suresh-patel', 'Suresh Patel', 'Suresh', 'Patel', 5),
  ('manisha-patel', 'Manisha Patel', 'Manisha', 'Patel', 6),
  ('bijal-patel', 'Bijal Patel', 'Bijal', 'Patel', 7)
on conflict (guest_key) do update set
  full_name = excluded.full_name,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  display_order = excluded.display_order;

create table if not exists public.rsvps (
  id uuid primary key default extensions.gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  attending boolean not null,
  party_size integer not null default 0 check (party_size between 0 and 12),
  additional_guests jsonb not null default '[]'::jsonb,
  dietary_restrictions text not null default '',
  message text not null default '',
  submitted_at timestamptz not null default now()
);

alter table public.rsvps add column if not exists guest_key text;
alter table public.rsvps add column if not exists guest_name text;
alter table public.rsvps add column if not exists updated_at timestamptz;

update public.rsvps as r
set
  guest_key = guest.guest_key,
  guest_name = guest.full_name,
  updated_at = coalesce(r.updated_at, r.submitted_at)
from public.approved_guests as guest
where r.guest_key is null
  and lower(trim(r.first_name || ' ' || r.last_name)) = lower(guest.full_name);

update public.rsvps
set updated_at = coalesce(updated_at, submitted_at)
where updated_at is null;

create unique index if not exists rsvps_guest_key_unique_idx on public.rsvps (guest_key);
create index if not exists rsvps_submitted_at_idx on public.rsvps (submitted_at desc);

alter table public.rsvps enable row level security;
alter table public.approved_guests enable row level security;

revoke all on table public.rsvps from anon, authenticated;
revoke all on table public.approved_guests from anon, authenticated;

drop policy if exists "Guests can submit RSVPs" on public.rsvps;

create or replace function public.submit_rsvp(
  p_guest_name text,
  p_attending boolean,
  p_party_size integer,
  p_additional_guests jsonb,
  p_dietary_restrictions text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_guest public.approved_guests%rowtype;
  response_existed boolean;
  safe_additional_guests jsonb := coalesce(p_additional_guests, '[]'::jsonb);
  safe_dietary text := trim(coalesce(p_dietary_restrictions, ''));
  safe_message text := trim(coalesce(p_message, ''));
begin
  select * into selected_guest
  from public.approved_guests
  where full_name = trim(coalesce(p_guest_name, ''));

  if selected_guest.guest_key is null then
    raise exception 'guest_not_approved' using errcode = '22023';
  end if;
  if p_attending is null then
    raise exception 'attendance_required' using errcode = '22023';
  end if;
  if jsonb_typeof(safe_additional_guests) <> 'array' then
    raise exception 'additional_guests_must_be_an_array' using errcode = '22023';
  end if;
  if jsonb_array_length(safe_additional_guests) > 11 then
    raise exception 'too_many_additional_guests' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(safe_additional_guests) as entry(value)
    where char_length(trim(entry.value)) not between 1 and 120
  ) then
    raise exception 'invalid_additional_guest_name' using errcode = '22023';
  end if;
  if char_length(safe_dietary) > 600 or char_length(safe_message) > 1200 then
    raise exception 'response_too_long' using errcode = '22023';
  end if;
  if p_attending and (
    p_party_size not between 1 and 12
    or jsonb_array_length(safe_additional_guests) <> p_party_size - 1
  ) then
    raise exception 'invalid_attending_party' using errcode = '22023';
  end if;
  if not p_attending and (p_party_size <> 0 or jsonb_array_length(safe_additional_guests) <> 0) then
    raise exception 'invalid_declined_party' using errcode = '22023';
  end if;

  select exists(
    select 1 from public.rsvps where guest_key = selected_guest.guest_key
  ) into response_existed;

  insert into public.rsvps (
    guest_key,
    guest_name,
    first_name,
    last_name,
    attending,
    party_size,
    additional_guests,
    dietary_restrictions,
    message,
    updated_at
  ) values (
    selected_guest.guest_key,
    selected_guest.full_name,
    selected_guest.first_name,
    selected_guest.last_name,
    p_attending,
    case when p_attending then p_party_size else 0 end,
    case when p_attending then safe_additional_guests else '[]'::jsonb end,
    case when p_attending then safe_dietary else '' end,
    safe_message,
    now()
  )
  on conflict (guest_key) do update set
    guest_name = excluded.guest_name,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    attending = excluded.attending,
    party_size = excluded.party_size,
    additional_guests = excluded.additional_guests,
    dietary_restrictions = excluded.dietary_restrictions,
    message = excluded.message,
    updated_at = now();

  return jsonb_build_object(
    'status', case when response_existed then 'updated' else 'created' end,
    'guest_name', selected_guest.full_name
  );
end;
$$;

revoke all on function public.submit_rsvp(text, boolean, integer, jsonb, text, text) from public;
grant execute on function public.submit_rsvp(text, boolean, integer, jsonb, text, text) to anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.rsvp_admin_config (
  singleton boolean primary key default true check (singleton),
  password_hash text not null
);

alter table private.rsvp_admin_config enable row level security;
revoke all on table private.rsvp_admin_config from public, anon, authenticated;

create or replace function public.admin_rsvp_overview(p_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_hash text;
  result jsonb;
begin
  select password_hash into configured_hash
  from private.rsvp_admin_config
  where singleton = true;

  if configured_hash is null
    or extensions.crypt(coalesce(p_password, ''), configured_hash) <> configured_hash then
    raise exception 'invalid_admin_password' using errcode = '28000';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'guest_key', r.guest_key,
    'guest_name', r.guest_name,
    'attending', r.attending,
    'party_size', r.party_size,
    'additional_guests', r.additional_guests,
    'dietary_restrictions', r.dietary_restrictions,
    'message', r.message,
    'submitted_at', r.submitted_at,
    'updated_at', r.updated_at
  ) order by guest.display_order), '[]'::jsonb)
  into result
  from public.rsvps as r
  join public.approved_guests as guest on guest.guest_key = r.guest_key;

  return result;
end;
$$;

revoke all on function public.admin_rsvp_overview(text) from public;
grant execute on function public.admin_rsvp_overview(text) to anon, authenticated;

-- Set the admin password separately so plaintext credentials never enter source control:
-- insert into private.rsvp_admin_config (singleton, password_hash)
-- values (true, extensions.crypt('YOUR STRONG PASSWORD', extensions.gen_salt('bf', 12)))
-- on conflict (singleton) do update set password_hash = excluded.password_hash;
