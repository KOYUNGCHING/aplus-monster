-- A+ Monster — Initial Schema
-- Append-only migration. Do not modify after applying.

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone     text not null default 'Asia/Taipei',
  preferences  jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "owner_all" on profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── Semesters ─────────────────────────────────────────────────────────────────
create table if not exists semesters (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  start_date date not null,
  end_date   date not null,
  status     text not null default 'active' check (status in ('active','archived')),
  timezone   text not null default 'Asia/Taipei',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table semesters enable row level security;
create policy "owner_all" on semesters
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on semesters(user_id, status);

-- ── Courses ───────────────────────────────────────────────────────────────────
create table if not exists courses (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  semester_id  uuid not null references semesters(id) on delete cascade,
  title        text not null,
  code         text not null default '',
  color        text not null default 'lavender',
  target_grade text not null default '',
  difficulty   text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  weekly_hours numeric not null default 3,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table courses enable row level security;
create policy "owner_all" on courses
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on courses(user_id, semester_id);

-- ── Deadlines ─────────────────────────────────────────────────────────────────
create table if not exists deadlines (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references courses(id) on delete cascade,
  title         text not null,
  due_at        timestamptz not null,
  type          text not null default 'assignment',
  confirmed     boolean not null default false,
  source_status text not null default 'user_provided',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table deadlines enable row level security;
create policy "owner_all" on deadlines
  using (exists (select 1 from courses where courses.id = deadlines.course_id and courses.user_id = auth.uid()))
  with check (exists (select 1 from courses where courses.id = deadlines.course_id and courses.user_id = auth.uid()));

-- ── Notes ─────────────────────────────────────────────────────────────────────
create table if not exists notes (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references courses(id) on delete cascade,
  topic_id      uuid,
  title         text not null,
  body_md       text not null default '',
  source_ids    uuid[] not null default '{}',
  tags          text[] not null default '{}',
  author_type   text not null default 'user' check (author_type in ('user','ai')),
  source_status text not null default 'user_provided',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table notes enable row level security;
create policy "owner_all" on notes
  using (exists (select 1 from courses where courses.id = notes.course_id and courses.user_id = auth.uid()))
  with check (exists (select 1 from courses where courses.id = notes.course_id and courses.user_id = auth.uid()));
create index on notes(course_id);

-- ── Quizzes ───────────────────────────────────────────────────────────────────
create table if not exists quizzes (
  id         uuid primary key default uuid_generate_v4(),
  course_id  uuid not null references courses(id) on delete cascade,
  topic_ids  uuid[] not null default '{}',
  title      text not null,
  difficulty text not null default 'medium',
  origin     text not null default 'user' check (origin in ('user','ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table quizzes enable row level security;
create policy "owner_all" on quizzes
  using (exists (select 1 from courses where courses.id = quizzes.course_id and courses.user_id = auth.uid()))
  with check (exists (select 1 from courses where courses.id = quizzes.course_id and courses.user_id = auth.uid()));
create index on quizzes(course_id);

-- ── Quiz Questions ────────────────────────────────────────────────────────────
create table if not exists quiz_questions (
  id            uuid primary key default uuid_generate_v4(),
  quiz_id       uuid not null references quizzes(id) on delete cascade,
  order_index   int not null default 0,
  type          text not null check (type in ('mcq','true_false','short_answer')),
  prompt        text not null,
  options       jsonb,
  answer        jsonb not null,
  explanation   text not null default '',
  difficulty    text not null default 'medium',
  topic_ids     uuid[] not null default '{}',
  source_status text not null default 'user_provided',
  created_at    timestamptz not null default now()
);
alter table quiz_questions enable row level security;
create policy "owner_all" on quiz_questions
  using (exists (
    select 1 from quizzes q
    join courses c on c.id = q.course_id
    where q.id = quiz_questions.quiz_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from quizzes q
    join courses c on c.id = q.course_id
    where q.id = quiz_questions.quiz_id and c.user_id = auth.uid()
  ));
create index on quiz_questions(quiz_id);

-- ── Quiz Attempts ─────────────────────────────────────────────────────────────
create table if not exists quiz_attempts (
  id           uuid primary key default uuid_generate_v4(),
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  started_at   timestamptz not null,
  submitted_at timestamptz,
  score        numeric,
  answers_json jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
alter table quiz_attempts enable row level security;
create policy "owner_all" on quiz_attempts
  using (exists (
    select 1 from quizzes q
    join courses c on c.id = q.course_id
    where q.id = quiz_attempts.quiz_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from quizzes q
    join courses c on c.id = q.course_id
    where q.id = quiz_attempts.quiz_id and c.user_id = auth.uid()
  ));
create index on quiz_attempts(quiz_id);

-- ── Mistakes ──────────────────────────────────────────────────────────────────
create table if not exists mistakes (
  id          uuid primary key default uuid_generate_v4(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  attempt_id  uuid not null references quiz_attempts(id) on delete cascade,
  topic_id    uuid,
  error_type  text,
  review_due_at timestamptz,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);
alter table mistakes enable row level security;
create policy "owner_all" on mistakes
  using (exists (
    select 1 from quiz_attempts qa
    join quizzes q on q.id = qa.quiz_id
    join courses c on c.id = q.course_id
    where qa.id = mistakes.attempt_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from quiz_attempts qa
    join quizzes q on q.id = qa.quiz_id
    join courses c on c.id = q.course_id
    where qa.id = mistakes.attempt_id and c.user_id = auth.uid()
  ));

-- ── Study Sessions ────────────────────────────────────────────────────────────
create table if not exists study_sessions (
  id               uuid primary key default uuid_generate_v4(),
  plan_id          uuid,
  course_id        uuid not null references courses(id) on delete cascade,
  topic_id         uuid,
  title            text not null,
  starts_at        timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0),
  status           text not null default 'planned' check (status in ('planned','completed','skipped')),
  priority         text not null default 'medium' check (priority in ('low','medium','high')),
  rationale        text not null default '',
  source_status    text not null default 'user_provided',
  origin           text not null default 'user' check (origin in ('user','ai')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table study_sessions enable row level security;
create policy "owner_all" on study_sessions
  using (exists (select 1 from courses where courses.id = study_sessions.course_id and courses.user_id = auth.uid()))
  with check (exists (select 1 from courses where courses.id = study_sessions.course_id and courses.user_id = auth.uid()));
create index on study_sessions(course_id, starts_at);

-- ── Agent Proposals ───────────────────────────────────────────────────────────
create table if not exists agent_proposals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  action_type   text not null,
  payload_json  jsonb not null default '{}',
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  assumptions   text[] not null default '{}',
  warnings      text[] not null default '{}',
  approved_at   timestamptz,
  created_at    timestamptz not null default now()
);
alter table agent_proposals enable row level security;
create policy "owner_all" on agent_proposals
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
