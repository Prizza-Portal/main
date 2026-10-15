-- Run this whole file once in Supabase → SQL Editor.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','teacher','admin')),
  created_at timestamptz default now()
);
create table posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('assignment','notice','resource','blog')),
  title text not null, body text, link text, due_date date,
  important boolean default false,
  author_id uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);
create table submissions (
  user_id uuid references profiles(id) on delete cascade default auth.uid(),
  post_id uuid references posts(id) on delete cascade,
  done_at timestamptz default now(),
  primary key (user_id, post_id)
);
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade default auth.uid(),
  endpoint text unique not null,
  subscription jsonb not null,
  created_at timestamptz default now()
);
create table settings (key text primary key, value text);

-- Every new signup gets a profile as a STUDENT (nobody can self-promote)
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function is_staff() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
$$;

-- Row Level Security
alter table profiles enable row level security;
alter table posts enable row level security;
alter table submissions enable row level security;
alter table push_subscriptions enable row level security;
alter table settings enable row level security;

create policy "own profile"      on profiles for select to authenticated using (id = auth.uid());
create policy "read posts"       on posts for select to authenticated using (true);
create policy "staff add posts"  on posts for insert to authenticated with check (is_staff());
create policy "staff edit posts" on posts for update to authenticated using (is_staff());
create policy "staff del posts"  on posts for delete to authenticated using (is_staff());
create policy "own submissions"  on submissions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own push subs"    on push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read settings"    on settings for select to authenticated using (true);
create policy "staff add settings" on settings for insert to authenticated with check (is_staff());
create policy "staff edit settings" on settings for update to authenticated using (is_staff());

-- Storage bucket for the schedule image
insert into storage.buckets (id, name, public) values ('files','files',true) on conflict do nothing;
create policy "staff upload files" on storage.objects for insert to authenticated with check (bucket_id = 'files' and is_staff());
create policy "staff update files" on storage.objects for update to authenticated using (bucket_id = 'files' and is_staff());

-- Live updates in the open app
alter publication supabase_realtime add table posts;

-- AFTER you sign up on the site, make yourself admin (change the email):
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
