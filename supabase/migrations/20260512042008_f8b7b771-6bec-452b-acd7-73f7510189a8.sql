
-- Messages (DMs)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  recipient_id uuid not null,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_pair on public.messages (least(sender_id,recipient_id), greatest(sender_id,recipient_id), created_at desc);
create index if not exists idx_messages_recipient on public.messages (recipient_id, created_at desc);
alter table public.messages enable row level security;

create policy "read own messages" on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "send messages" on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);
create policy "mark messages read" on public.messages for update to authenticated
  using (auth.uid() = recipient_id);

-- Notification prefs
create table if not exists public.notification_prefs (
  user_id uuid primary key,
  in_app boolean not null default true,
  web_push boolean not null default true,
  duels boolean not null default true,
  challenges boolean not null default true,
  streaks boolean not null default true,
  likes boolean not null default true,
  comments boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
create policy "own prefs read" on public.notification_prefs for select to authenticated using (auth.uid() = user_id);
create policy "own prefs upsert" on public.notification_prefs for insert to authenticated with check (auth.uid() = user_id);
create policy "own prefs update" on public.notification_prefs for update to authenticated using (auth.uid() = user_id);

-- Weekly school leaderboard
create table if not exists public.school_leaderboard_weekly (
  week_start date not null,
  school text not null,
  total_xp bigint not null default 0,
  member_count int not null default 0,
  rank int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (week_start, school)
);
alter table public.school_leaderboard_weekly enable row level security;
create policy "leaderboard readable" on public.school_leaderboard_weekly for select to authenticated using (true);

create or replace function public.refresh_school_leaderboard()
returns void language plpgsql security definer set search_path=public as $$
declare wk date := date_trunc('week', current_date)::date;
begin
  with agg as (
    select school, sum(xp)::bigint as total_xp, count(*)::int as cnt
    from public.profiles where school is not null and school <> ''
    group by school
  ), ranked as (
    select school, total_xp, cnt, rank() over (order by total_xp desc) as r from agg
  )
  insert into public.school_leaderboard_weekly (week_start, school, total_xp, member_count, rank, updated_at)
  select wk, school, total_xp, cnt, r, now() from ranked
  on conflict (week_start, school) do update
    set total_xp = excluded.total_xp,
        member_count = excluded.member_count,
        rank = excluded.rank,
        updated_at = now();
end $$;

-- Duel round timestamps for fastest-correct-wins
alter table public.duel_rounds add column if not exists answered_at_a timestamptz;
alter table public.duel_rounds add column if not exists answered_at_b timestamptz;

-- Realtime enable (idempotent)
do $$
declare t text;
begin
  for t in select unnest(array['posts','challenges','comments','likes','reposts','duels','duel_rounds','notifications','profiles','messages','school_leaderboard_weekly']) loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;
