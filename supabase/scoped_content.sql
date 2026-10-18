-- Run ONCE in Supabase → SQL Editor, AFTER scoped_files.sql.
-- Makes SESSIONS (Zoom) and POSTS (notices, homework, resources, blog) class/school-specific.
-- Nothing is deleted: every existing session/post stays in "Shared with everyone" (visible to all) until you edit it.
-- Same rules as files: Everyone → all users · School → that school · Class → that class only.
-- Admins write anywhere; teachers only inside their own school; students never.

-- 1) scope columns
alter table sessions add column if not exists school_id uuid references schools(id), add column if not exists class_id uuid;
alter table posts    add column if not exists school_id uuid references schools(id), add column if not exists class_id uuid;
alter table sessions add constraint sessions_class_fk foreign key (class_id, school_id) references classes (id, school_id);
alter table posts    add constraint posts_class_fk    foreign key (class_id, school_id) references classes (id, school_id);
alter table sessions add constraint sessions_scope_chk check (class_id is null or school_id is not null);
alter table posts    add constraint posts_scope_chk    check (class_id is null or school_id is not null);
create index if not exists sessions_scope_idx on sessions (school_id, class_id);
create index if not exists posts_scope_idx    on posts (school_id, class_id);

-- 2) row policies (replace the old "everyone can read / any staff can write")
drop policy if exists "read sessions" on sessions;       drop policy if exists "read posts" on posts;
drop policy if exists "staff add sessions" on sessions;  drop policy if exists "staff add posts" on posts;
drop policy if exists "staff edit sessions" on sessions; drop policy if exists "staff edit posts" on posts;
drop policy if exists "staff del sessions" on sessions;  drop policy if exists "staff del posts" on posts;

create policy "scoped read sessions" on sessions for select to authenticated using (can_see(school_id, class_id));
create policy "scoped add sessions"  on sessions for insert to authenticated with check (can_write(school_id, class_id));
create policy "scoped edit sessions" on sessions for update to authenticated using (can_write(school_id, class_id)) with check (can_write(school_id, class_id));
create policy "scoped del sessions"  on sessions for delete to authenticated using (can_write(school_id, class_id));
create policy "scoped read posts" on posts for select to authenticated using (can_see(school_id, class_id));
create policy "scoped add posts"  on posts for insert to authenticated with check (can_write(school_id, class_id));
create policy "scoped edit posts" on posts for update to authenticated using (can_write(school_id, class_id)) with check (can_write(school_id, class_id));
create policy "scoped del posts"  on posts for delete to authenticated using (can_write(school_id, class_id));

-- 3) attendance: students only for sessions they can see; teachers only read attendance of sessions they manage
drop policy if exists "mark own attendance" on session_attendance;
drop policy if exists "read attendance" on session_attendance;
create policy "mark own attendance scoped" on session_attendance for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from sessions s where s.id = session_id));
create policy "read attendance scoped" on session_attendance for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from sessions s where s.id = session_id and can_write(s.school_id, s.class_id)));

-- 4) teachers can only look up people in their own school (admins see everyone)
drop policy if exists "staff read profiles" on profiles;
create policy "staff read scoped profiles" on profiles for select to authenticated
  using (is_admin() or (is_staff() and school_id is not null and school_id = my_school()));

-- 5) reminders go only to the session's own class/school
create or replace function send_session_reminders() returns void language plpgsql security definer set search_path = public as $$
declare s record;
begin
  for s in select * from sessions where coalesce(reminded, false) = false and starts_at > now() and starts_at <= now() + interval '15 minutes' loop
    insert into posts (kind, title, body, important, author_id, school_id, class_id)
    values ('notice', 'Starting soon: ' || s.title, 'Starts in about 15 minutes. Open Prizza → Zoom Sessions to join.', true, s.created_by, s.school_id, s.class_id);
    update sessions set reminded = true where id = s.id;
  end loop;
end $$;
