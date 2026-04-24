create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null unique,
  display_name text not null,
  full_name text,
  school_name text,
  gender text check (gender in ('男性', '女性', 'その他', '回答しない')),
  club_name text,
  onboarding_completed boolean not null default false,
  avatar_url text,
  avatar_color text default '#1B2A4A',
  is_premium boolean not null default false,
  stripe_customer_id text,
  is_admin boolean not null default false,
  free_views_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles add column if not exists full_name text;
alter table public.user_profiles add column if not exists school_name text;
alter table public.user_profiles add column if not exists gender text;
alter table public.user_profiles add column if not exists club_name text;
alter table public.user_profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.user_profiles add column if not exists is_premium boolean not null default false;
alter table public.user_profiles add column if not exists stripe_customer_id text;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text not null,
  life_sci text not null,
  physics_chem text not null,
  stats_math text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_schedules (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  year integer not null,
  application_start date,
  application_end date,
  first_exam_date date,
  second_exam_date date,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete set null,
  subject text not null,
  year integer not null,
  difficulty integer not null default 3 check (difficulty between 1 and 5),
  question text not null,
  options text,
  answer text,
  answer_detail text,
  is_premium boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.problem_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  status text not null check (status in ('correct', 'wrong', 'bookmarked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, problem_id)
);

create table if not exists public.study_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  subject text not null,
  minutes integer not null check (minutes > 0),
  memo text,
  logged_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.community_channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  is_premium boolean not null default false,
  sort_order integer not null default 0,
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists user_profiles_stripe_customer_id_key
  on public.user_profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.community_channels(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  display_name text not null,
  avatar_url text,
  avatar_color text,
  content text not null,
  is_tutor boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at before update on public.user_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists universities_updated_at on public.universities;
create trigger universities_updated_at before update on public.universities
for each row execute procedure public.set_updated_at();

drop trigger if exists exam_schedules_updated_at on public.exam_schedules;
create trigger exam_schedules_updated_at before update on public.exam_schedules
for each row execute procedure public.set_updated_at();

drop trigger if exists problems_updated_at on public.problems;
create trigger problems_updated_at before update on public.problems
for each row execute procedure public.set_updated_at();

drop trigger if exists problem_progress_updated_at on public.problem_progress;
create trigger problem_progress_updated_at before update on public.problem_progress
for each row execute procedure public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.universities enable row level security;
alter table public.exam_schedules enable row level security;
alter table public.problems enable row level security;
alter table public.problem_progress enable row level security;
alter table public.study_logs enable row level security;
alter table public.community_channels enable row level security;
alter table public.community_messages enable row level security;

drop policy if exists "profiles_select_self" on public.user_profiles;
create policy "profiles_select_self" on public.user_profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.user_profiles;
create policy "profiles_update_self" on public.user_profiles
for update using (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.user_profiles;
create policy "profiles_insert_self" on public.user_profiles
for insert with check (auth.uid() = id or auth.role() = 'service_role');

drop policy if exists "universities_public_read" on public.universities;
create policy "universities_public_read" on public.universities
for select using (true);

drop policy if exists "universities_admin_write" on public.universities;
create policy "universities_admin_write" on public.universities
for all using (
  exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "exam_schedules_public_read" on public.exam_schedules;
create policy "exam_schedules_public_read" on public.exam_schedules
for select using (true);

drop policy if exists "exam_schedules_admin_write" on public.exam_schedules;
create policy "exam_schedules_admin_write" on public.exam_schedules
for all using (
  exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "problems_public_read" on public.problems;
create policy "problems_public_read" on public.problems
for select using (true);

drop policy if exists "problems_admin_write" on public.problems;
create policy "problems_admin_write" on public.problems
for all using (
  exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "progress_select_self" on public.problem_progress;
create policy "progress_select_self" on public.problem_progress
for select using (auth.uid() = user_id);

drop policy if exists "progress_write_self" on public.problem_progress;
create policy "progress_write_self" on public.problem_progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "study_logs_select_self" on public.study_logs;
create policy "study_logs_select_self" on public.study_logs
for select using (auth.uid() = user_id);

drop policy if exists "study_logs_write_self" on public.study_logs;
create policy "study_logs_write_self" on public.study_logs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "channels_public_read" on public.community_channels;
create policy "channels_public_read" on public.community_channels
for select using (true);

drop policy if exists "messages_read_public" on public.community_messages;
create policy "messages_read_public" on public.community_messages
for select using (true);

drop policy if exists "messages_write_authenticated" on public.community_messages;
create policy "messages_write_authenticated" on public.community_messages
for insert with check (auth.uid() = user_id);
