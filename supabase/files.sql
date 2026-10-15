-- Run once in Supabase → SQL Editor (after schema.sql). Adds the Files library.
create table folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  created_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);
create table files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete cascade,
  name text not null, path text not null, size bigint, mime text,
  uploaded_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);
alter table folders enable row level security;
alter table files enable row level security;
create policy "read folders" on folders for select to authenticated using (true);
create policy "staff add folders" on folders for insert to authenticated with check (is_staff());
create policy "staff edit folders" on folders for update to authenticated using (is_staff());
create policy "staff del folders" on folders for delete to authenticated using (is_staff());
create policy "read files" on files for select to authenticated using (true);
create policy "staff add files" on files for insert to authenticated with check (is_staff());
create policy "staff edit files" on files for update to authenticated using (is_staff());
create policy "staff del files" on files for delete to authenticated using (is_staff());

-- PRIVATE bucket: only logged-in users can read, only staff can upload/delete
insert into storage.buckets (id, name, public) values ('library','library',false) on conflict do nothing;
create policy "read library" on storage.objects for select to authenticated using (bucket_id = 'library');
create policy "staff upload library" on storage.objects for insert to authenticated with check (bucket_id = 'library' and is_staff());
create policy "staff delete library" on storage.objects for delete to authenticated using (bucket_id = 'library' and is_staff());

alter publication supabase_realtime add table folders, files;
