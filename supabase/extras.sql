-- Run ONCE in Supabase → SQL Editor, after schema.sql, files.sql and sessions.sql.
-- Adds: Quizzes, Session attendance, Users page support, Session reminders.

-- ===== Users page support =====
alter table profiles add column if not exists username text;
update profiles p set username = split_part(u.email,'@',1) from auth.users u where u.id = p.id and p.username is null;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, username)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)), split_part(new.email,'@',1));
  return new;
end $$;

create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;
create policy "staff read profiles" on profiles for select to authenticated using (is_staff());
create policy "admin update profiles" on profiles for update to authenticated using (is_admin()) with check (is_admin());

-- ===== Session attendance =====
create table session_attendance (
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade default auth.uid(),
  joined_at timestamptz default now(),
  primary key (session_id, user_id)
);
alter table session_attendance enable row level security;
create policy "mark own attendance" on session_attendance for insert to authenticated with check (user_id = auth.uid());
create policy "read attendance" on session_attendance for select to authenticated using (user_id = auth.uid() or is_staff());

-- ===== Quizzes =====
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  created_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  position int not null default 0,
  prompt text not null,
  options jsonb not null
);
-- correct answers live in their own table that students can NOT read
create table quiz_answers (
  question_id uuid primary key references quiz_questions(id) on delete cascade,
  correct_index int not null
);
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  score int not null, total int not null, answers jsonb,
  created_at timestamptz default now()
);
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;
alter table quiz_attempts enable row level security;
create policy "read quizzes" on quizzes for select to authenticated using (true);
create policy "staff add quizzes" on quizzes for insert to authenticated with check (is_staff());
create policy "staff edit quizzes" on quizzes for update to authenticated using (is_staff());
create policy "staff del quizzes" on quizzes for delete to authenticated using (is_staff());
create policy "read questions" on quiz_questions for select to authenticated using (true);
create policy "staff add questions" on quiz_questions for insert to authenticated with check (is_staff());
create policy "staff edit questions" on quiz_questions for update to authenticated using (is_staff());
create policy "staff del questions" on quiz_questions for delete to authenticated using (is_staff());
create policy "staff only answers" on quiz_answers for all to authenticated using (is_staff()) with check (is_staff());
create policy "read attempts" on quiz_attempts for select to authenticated using (user_id = auth.uid() or is_staff());

-- Scoring happens here, on the server
create or replace function submit_quiz(p_quiz uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare q record; s int := 0; t int := 0; picked int; res jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  for q in select qq.id, a.correct_index from quiz_questions qq join quiz_answers a on a.question_id = qq.id
           where qq.quiz_id = p_quiz order by qq.position loop
    t := t + 1;
    picked := (p_answers ->> q.id::text)::int;
    if picked = q.correct_index then s := s + 1; end if;
    res := res || jsonb_build_object('question_id', q.id, 'correct', q.correct_index, 'picked', picked);
  end loop;
  insert into quiz_attempts (quiz_id, user_id, score, total, answers) values (p_quiz, auth.uid(), s, t, p_answers);
  return jsonb_build_object('score', s, 'total', t, 'detail', res);
end $$;

-- ===== Session reminders (15 minutes before) =====
alter table sessions add column if not exists reminded boolean default false;

create or replace function send_session_reminders() returns void language plpgsql security definer set search_path = public as $$
declare s record;
begin
  for s in select * from sessions where coalesce(reminded,false) = false and starts_at > now() and starts_at <= now() + interval '15 minutes' loop
    -- an IMPORTANT notice → your existing posts webhook turns it into a push notification
    insert into posts (kind, title, body, important, author_id)
    values ('notice', 'Starting soon: ' || s.title, 'Starts in about 15 minutes. Open Prizza → Zoom Sessions to join.', true, s.created_by);
    update sessions set reminded = true where id = s.id;
  end loop;
end $$;

create extension if not exists pg_cron;
select cron.schedule('session-reminders', '* * * * *', 'select public.send_session_reminders()');
