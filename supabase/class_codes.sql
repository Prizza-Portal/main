-- Run ONCE in Supabase → SQL Editor (after extras.sql). Adds schools, classes and CLASS CODES.
-- Safety design:
--   * Codes are random (12 chars, ~60 bits) and only a SHA-256 hash is stored — nobody can read a code back, not even an admin or a database leak.
--   * Signup is enforced INSIDE the database (a trigger on auth.users), so it cannot be bypassed by calling the API directly.
--   * No function accepts a code and returns information. A wrong, expired, full or revoked code all give the same generic failure.
--   * The code is removed from the user record as soon as it is checked.

create extension if not exists pgcrypto with schema extensions;

create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 80),
  created_at timestamptz default now()
);
create table classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  created_at timestamptz default now(),
  unique (school_id, name)
);
create table signup_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  hint text not null,                                  -- last 4 characters only, to tell codes apart
  label text,
  school_id uuid not null references schools(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  max_uses int not null default 30 check (max_uses between 1 and 1000),
  uses int not null default 0,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);
alter table profiles
  add column if not exists school_id uuid references schools(id) on delete set null,
  add column if not exists class_id uuid references classes(id) on delete set null;

create or replace function my_school() returns uuid language sql security definer stable set search_path = public as $$
  select school_id from profiles where id = auth.uid() $$;
create or replace function my_class() returns uuid language sql security definer stable set search_path = public as $$
  select class_id from profiles where id = auth.uid() $$;

alter table schools enable row level security;
alter table classes enable row level security;
alter table signup_codes enable row level security;
create policy "see own or staff schools" on schools for select to authenticated using (is_staff() or id = my_school());
create policy "admin add schools"  on schools for insert to authenticated with check (is_admin());
create policy "admin edit schools" on schools for update to authenticated using (is_admin());
create policy "admin del schools"  on schools for delete to authenticated using (is_admin());
create policy "see own or staff classes" on classes for select to authenticated using (is_staff() or id = my_class());
create policy "admin add classes"  on classes for insert to authenticated with check (is_admin());
create policy "admin edit classes" on classes for update to authenticated using (is_admin());
create policy "admin del classes"  on classes for delete to authenticated using (is_admin());
create policy "admin only codes" on signup_codes for all to authenticated using (is_admin()) with check (is_admin());
revoke all on signup_codes from anon;

-- Admin generates a code. The plain code is returned ONCE and never stored.
create or replace function create_signup_code(p_label text, p_class uuid, p_max int default 30, p_days int default 14)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   -- 32 symbols, no I/O/0/1 look-alikes
  raw bytea; code text := ''; i int; sid uuid;
begin
  if not (is_admin() or session_user in ('postgres','supabase_admin')) then raise exception 'Admins only'; end if;
  select school_id into sid from classes where id = p_class;
  if sid is null then raise exception 'Unknown class'; end if;
  raw := gen_random_bytes(12);
  for i in 0..11 loop code := code || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1); end loop;
  insert into signup_codes (code_hash, hint, label, school_id, class_id, max_uses, expires_at)
  values (encode(digest(code, 'sha256'), 'hex'), right(code, 4), nullif(trim(p_label), ''), sid, p_class,
          greatest(1, least(coalesce(p_max, 30), 1000)), now() + make_interval(days => greatest(1, least(coalesce(p_days, 14), 365))));
  return code;
end $$;
revoke execute on function create_signup_code(text, uuid, int, int) from public, anon;
grant execute on function create_signup_code(text, uuid, int, int) to authenticated;

-- The gate: every new account needs a valid code, unless an admin created it (app_metadata can only be set by the admin API).
create or replace function enforce_signup_code() returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare c text; sc record;
begin
  if coalesce(new.raw_app_meta_data ->> 'admin_created', '') = 'true' then return new; end if;
  c := upper(regexp_replace(coalesce(new.raw_user_meta_data ->> 'class_code', ''), '[^A-Za-z0-9]', '', 'g'));
  if length(c) <> 12 then raise exception 'Invalid code'; end if;
  update signup_codes set uses = uses + 1
   where code_hash = encode(digest(c, 'sha256'), 'hex') and not revoked and uses < max_uses and expires_at > now()
   returning school_id, class_id into sc;
  if not found then raise exception 'Invalid code'; end if;
  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('school_id', sc.school_id, 'class_id', sc.class_id);
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'class_code';   -- never keep the code
  return new;
end $$;
drop trigger if exists a_enforce_signup_code on auth.users;
create trigger a_enforce_signup_code before insert on auth.users for each row execute function enforce_signup_code();

-- New profiles pick up the school/class that the code was tied to
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, username, school_id, class_id)
  values (new.id,
          left(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)), 80),
          split_part(new.email, '@', 1),
          nullif(new.raw_app_meta_data ->> 'school_id', '')::uuid,
          nullif(new.raw_app_meta_data ->> 'class_id', '')::uuid);
  return new;
end $$;

-- First-ever setup with no admin yet? In this SQL Editor run, for example:
--   insert into schools (name) values ('My School');
--   insert into classes (school_id, name) select id, 'Year 9A' from schools where name = 'My School';
--   select create_signup_code('First class', (select id from classes limit 1), 30, 14);
