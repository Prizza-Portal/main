-- Run ONCE in Supabase → SQL Editor, AFTER class_codes.sql.
-- Gives every school and class its own files. NOTHING is deleted or changed in your existing files:
-- all current folders/files simply stay in "Shared with everyone" (visible to all), and an admin can then move them into a class.
--
-- Who sees what:  Everyone space → all users.  School space → that school.  Class space → that class only.
--                 Admins see everything. Teachers see their whole school. Students see everyone + their school + their class.
-- Who can change: Admins anywhere (incl. "everyone"). Teachers only inside their own school. Students never.

-- 1) scope columns (null = shared with everyone)
alter table classes add constraint classes_id_school_key unique (id, school_id);

alter table folders add column if not exists school_id uuid references schools(id), add column if not exists class_id uuid;
alter table files   add column if not exists school_id uuid references schools(id), add column if not exists class_id uuid;
alter table folders add constraint folders_class_fk foreign key (class_id, school_id) references classes (id, school_id);
alter table files   add constraint files_class_fk   foreign key (class_id, school_id) references classes (id, school_id);
alter table folders add constraint folders_scope_chk check (class_id is null or school_id is not null);
alter table files   add constraint files_scope_chk   check (class_id is null or school_id is not null);
create index if not exists folders_scope_idx on folders (school_id, class_id);
create index if not exists files_scope_idx   on files (school_id, class_id);
create index if not exists files_path_idx    on files (path);

-- 2) the rules
create or replace function can_see(p_school uuid, p_class uuid) returns boolean language sql security definer stable set search_path = public as $$
  select is_admin()
      or p_school is null
      or (p_class is null and p_school = my_school())
      or p_class = my_class()
      or (is_staff() and p_school = my_school())
$$;
create or replace function can_write(p_school uuid, p_class uuid) returns boolean language sql security definer stable set search_path = public as $$
  select is_admin() or (is_staff() and p_school is not null and p_school = my_school())
$$;

-- 3) items inside a folder always take the folder's scope (the browser can't choose a different one)
create or replace function folder_inherit_scope() returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.parent_id is not null then
    select school_id, class_id into p from folders where id = new.parent_id;
    if not found then raise exception 'Parent folder not found'; end if;
    new.school_id := p.school_id; new.class_id := p.class_id;
  end if;
  return new;
end $$;
create or replace function file_inherit_scope() returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.folder_id is not null then
    select school_id, class_id into p from folders where id = new.folder_id;
    if not found then raise exception 'Folder not found'; end if;
    new.school_id := p.school_id; new.class_id := p.class_id;
  end if;
  return new;
end $$;
drop trigger if exists a_folder_scope on folders;
create trigger a_folder_scope before insert on folders for each row execute function folder_inherit_scope();
drop trigger if exists a_file_scope on files;
create trigger a_file_scope before insert on files for each row execute function file_inherit_scope();

-- 4) row policies (replace the old "everyone can read" ones)
drop policy if exists "read folders" on folders;       drop policy if exists "read files" on files;
drop policy if exists "staff add folders" on folders;  drop policy if exists "staff add files" on files;
drop policy if exists "staff edit folders" on folders; drop policy if exists "staff edit files" on files;
drop policy if exists "staff del folders" on folders;  drop policy if exists "staff del files" on files;

create policy "scoped read folders" on folders for select to authenticated using (can_see(school_id, class_id));
create policy "scoped add folders"  on folders for insert to authenticated with check (can_write(school_id, class_id));
create policy "scoped edit folders" on folders for update to authenticated using (can_write(school_id, class_id)) with check (can_write(school_id, class_id));
create policy "scoped del folders"  on folders for delete to authenticated using (can_write(school_id, class_id));
create policy "scoped read files" on files for select to authenticated using (can_see(school_id, class_id));
create policy "scoped add files"  on files for insert to authenticated with check (can_write(school_id, class_id));
create policy "scoped edit files" on files for update to authenticated using (can_write(school_id, class_id)) with check (can_write(school_id, class_id));
create policy "scoped del files"  on files for delete to authenticated using (can_write(school_id, class_id));

-- 5) the actual stored files: you can only download/delete a stored file if you can see its row in "files"
--    (so nobody can list the storage bucket and grab another class's files)
drop policy if exists "read library" on storage.objects;
drop policy if exists "staff delete library" on storage.objects;
create policy "read library scoped" on storage.objects for select to authenticated
  using (bucket_id = 'library' and exists (select 1 from public.files f where f.path = storage.objects.name));
create policy "delete library scoped" on storage.objects for delete to authenticated
  using (bucket_id = 'library' and exists (select 1 from public.files f where f.path = storage.objects.name and public.can_write(f.school_id, f.class_id)));

-- 6) move a top-level folder (with everything inside it) or a top-level file to another space — all or nothing
create or replace function move_files_scope(p_kind text, p_id uuid, p_school uuid, p_class uuid) returns void
language plpgsql as $$   -- runs with YOUR permissions, so the policies above decide what you may move
declare n int;
begin
  if p_kind = 'file' then
    update files set school_id = p_school, class_id = p_class where id = p_id and folder_id is null;
    get diagnostics n = row_count;
  elsif p_kind = 'folder' then
    update folders set school_id = p_school, class_id = p_class
     where id in (with recursive t as (select id from folders where id = p_id and parent_id is null
                                       union all select f.id from folders f join t on f.parent_id = t.id) select id from t);
    get diagnostics n = row_count;
    update files set school_id = p_school, class_id = p_class
     where folder_id in (with recursive t as (select id from folders where id = p_id
                                              union all select f.id from folders f join t on f.parent_id = t.id) select id from t);
  else raise exception 'Bad kind'; end if;
  if n = 0 then raise exception 'Not allowed, or item not found'; end if;
end $$;
revoke execute on function move_files_scope(text, uuid, uuid, uuid) from public, anon;
grant execute on function move_files_scope(text, uuid, uuid, uuid) to authenticated;
