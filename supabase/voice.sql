-- Run once in Supabase → SQL Editor. Adds the Voice Rooms channel list.
create table voice_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int default 0,
  created_at timestamptz default now()
);
alter table voice_channels enable row level security;
create policy "read channels" on voice_channels for select to authenticated using (true);
create policy "staff add channels" on voice_channels for insert to authenticated with check (is_staff());
create policy "staff edit channels" on voice_channels for update to authenticated using (is_staff());
create policy "staff del channels" on voice_channels for delete to authenticated using (is_staff());
insert into voice_channels (name, position) values ('General', 0), ('Study Room 1', 1), ('Study Room 2', 2);
alter publication supabase_realtime add table voice_channels;
