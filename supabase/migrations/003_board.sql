-- Board threads & replies for community board feature
create table if not exists public.board_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('相談', '勉強法', '出願', '面接', '雑談')),
  body text not null,
  user_id uuid not null,
  display_name text not null,
  avatar_color text,
  is_premium boolean not null default false,
  is_pinned boolean not null default false,
  is_closed boolean not null default false,
  reply_count integer not null default 0,
  last_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_threads_last_reply_idx on public.board_threads (last_reply_at desc nulls last);
create index if not exists board_threads_category_idx on public.board_threads (category);
create index if not exists board_threads_is_premium_idx on public.board_threads (is_premium);

create table if not exists public.board_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.board_threads(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  avatar_color text,
  content text not null,
  is_tutor boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists board_replies_thread_idx on public.board_replies (thread_id);
create index if not exists board_replies_created_idx on public.board_replies (created_at);

create or replace function public.increment_board_thread_reply(p_thread_id uuid)
returns void
language plpgsql
as $$
begin
  update public.board_threads
  set reply_count = reply_count + 1,
      last_reply_at = now(),
      updated_at = now()
  where id = p_thread_id;
end;
$$;
