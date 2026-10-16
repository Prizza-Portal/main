-- Run once in Supabase → SQL Editor. Adds the Sessions (live classes) page.
create table sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text not null default 'zoom' check (platform in ('zoom','meet','teams','youtube','other')),
  link text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  description text,
  created_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now(),
  check (ends_at > starts_at)
);
alter table sessions enable row level security;
create policy "read sessions" on sessions for select to authenticated using (true);
create policy "staff add sessions" on sessions for insert to authenticated with check (is_staff());
create policy "staff edit sessions" on sessions for update to authenticated using (is_staff());
create policy "staff del sessions" on sessions for delete to authenticated using (is_staff());
alter publication supabase_realtime add table sessions;
