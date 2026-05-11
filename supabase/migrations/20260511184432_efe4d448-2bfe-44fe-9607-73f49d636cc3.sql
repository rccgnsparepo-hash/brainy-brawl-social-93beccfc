
-- =========================================
-- ENUMS
-- =========================================
create type post_type as enum ('text','challenge','duel','achievement');
create type difficulty as enum ('easy','medium','hard');
create type duel_status as enum ('waiting','active','finished','cancelled');
create type notif_type as enum ('challenge_invite','duel_invite','duel_win','duel_loss','streak_reward','level_up','like','comment','repost','mention');

-- =========================================
-- PROFILES
-- =========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text not null,
  school text not null,
  avatar text not null default '🦊',
  grade text,
  bio text,
  instagram text,
  xp int not null default 0,
  level int not null default 1,
  streak int not null default 0,
  last_active_date date,
  wins int not null default 0,
  losses int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles readable by authenticated"
on public.profiles for select to authenticated using (true);

create policy "users update own profile"
on public.profiles for update to authenticated using (auth.uid() = id);

create policy "users insert own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);

-- =========================================
-- POSTS
-- =========================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type post_type not null default 'text',
  content text not null,
  challenge_id uuid,
  duel_id uuid,
  achievement_title text,
  achievement_icon text,
  likes_count int not null default 0,
  comments_count int not null default 0,
  reposts_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.posts(created_at desc);
create index on public.posts(user_id);

alter table public.posts enable row level security;
create policy "posts readable by authenticated" on public.posts for select to authenticated using (true);
create policy "users create own posts" on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own posts" on public.posts for delete to authenticated using (auth.uid() = user_id);

-- =========================================
-- CHALLENGES
-- =========================================
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  answer text not null,
  options text[] not null default '{}',
  time_limit int not null default 30,
  reward_xp int not null default 25,
  difficulty difficulty not null default 'medium',
  solved_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.challenges enable row level security;
create policy "challenges readable" on public.challenges for select to authenticated using (true);
create policy "create own challenges" on public.challenges for insert to authenticated with check (auth.uid() = creator_id);

-- =========================================
-- CHALLENGE SOLVES
-- =========================================
create table public.challenge_solves (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  correct boolean not null,
  time_taken_ms int,
  created_at timestamptz not null default now(),
  unique(challenge_id, user_id)
);
alter table public.challenge_solves enable row level security;
create policy "solves readable" on public.challenge_solves for select to authenticated using (true);
create policy "create own solves" on public.challenge_solves for insert to authenticated with check (auth.uid() = user_id);

-- =========================================
-- LIKES / COMMENTS / REPOSTS
-- =========================================
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.likes enable row level security;
create policy "likes readable" on public.likes for select to authenticated using (true);
create policy "user toggles own likes" on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "user removes own likes" on public.likes for delete to authenticated using (auth.uid() = user_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index on public.comments(post_id, created_at);
alter table public.comments enable row level security;
create policy "comments readable" on public.comments for select to authenticated using (true);
create policy "create own comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

create table public.reposts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.reposts enable row level security;
create policy "reposts readable" on public.reposts for select to authenticated using (true);
create policy "user reposts" on public.reposts for insert to authenticated with check (auth.uid() = user_id);
create policy "user undo reposts" on public.reposts for delete to authenticated using (auth.uid() = user_id);

-- =========================================
-- DUELS
-- =========================================
create table public.duels (
  id uuid primary key default gen_random_uuid(),
  player_a uuid not null references public.profiles(id) on delete cascade,
  player_b uuid references public.profiles(id) on delete cascade,
  status duel_status not null default 'waiting',
  current_round int not null default 0,
  total_rounds int not null default 5,
  score_a int not null default 0,
  score_b int not null default 0,
  winner_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on public.duels(status);
alter table public.duels enable row level security;
create policy "duels readable" on public.duels for select to authenticated using (true);
create policy "create duels" on public.duels for insert to authenticated with check (auth.uid() = player_a);
create policy "participants update duel" on public.duels for update to authenticated using (auth.uid() = player_a or auth.uid() = player_b);

create table public.duel_rounds (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.duels(id) on delete cascade,
  round_number int not null,
  question text not null,
  answer text not null,
  options text[] not null,
  answer_a text,
  answer_b text,
  winner uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.duel_rounds enable row level security;
create policy "rounds readable" on public.duel_rounds for select to authenticated using (true);
create policy "rounds insert by participant" on public.duel_rounds for insert to authenticated
  with check (exists (select 1 from public.duels d where d.id = duel_id and (d.player_a = auth.uid() or d.player_b = auth.uid())));
create policy "rounds update by participant" on public.duel_rounds for update to authenticated
  using (exists (select 1 from public.duels d where d.id = duel_id and (d.player_a = auth.uid() or d.player_b = auth.uid())));

create table public.duel_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now()
);
alter table public.duel_queue enable row level security;
create policy "queue readable" on public.duel_queue for select to authenticated using (true);
create policy "join own queue" on public.duel_queue for insert to authenticated with check (auth.uid() = user_id);
create policy "leave own queue" on public.duel_queue for delete to authenticated using (auth.uid() = user_id);

-- =========================================
-- NOTIFICATIONS
-- =========================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type notif_type not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "user reads own notifs" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "user updates own notifs" on public.notifications for update to authenticated using (auth.uid() = user_id);
create policy "system inserts notifs" on public.notifications for insert to authenticated with check (true);

-- =========================================
-- XP EVENTS
-- =========================================
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index on public.xp_events(user_id, created_at desc);
alter table public.xp_events enable row level security;
create policy "xp readable own" on public.xp_events for select to authenticated using (auth.uid() = user_id);

-- =========================================
-- FUNCTIONS & TRIGGERS
-- =========================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, display_name, school, avatar, grade, bio, instagram)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', 'user_' || substr(new.id::text,1,8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'New Student'),
    coalesce(new.raw_user_meta_data->>'school', 'Unknown School'),
    coalesce(new.raw_user_meta_data->>'avatar', '🦊'),
    new.raw_user_meta_data->>'grade',
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'instagram'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Award XP function (server-trusted)
create or replace function public.award_xp(_user_id uuid, _amount int, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare
  cur_xp int; new_xp int; cur_level int; new_level int;
  cur_streak int; cur_last date; today date := current_date;
  next_streak int;
begin
  select xp, level, streak, last_active_date into cur_xp, cur_level, cur_streak, cur_last
  from public.profiles where id = _user_id for update;

  if not found then return; end if;

  new_xp := cur_xp + _amount;
  new_level := greatest(1, floor(sqrt(new_xp::numeric / 50))::int + 1);

  if cur_last is null then
    next_streak := 1;
  elsif cur_last = today then
    next_streak := cur_streak;
  elsif cur_last = today - 1 then
    next_streak := cur_streak + 1;
  else
    next_streak := 1;
  end if;

  update public.profiles
    set xp = new_xp,
        level = new_level,
        streak = next_streak,
        last_active_date = today,
        updated_at = now()
  where id = _user_id;

  insert into public.xp_events(user_id, amount, reason) values (_user_id, _amount, _reason);

  if new_level > cur_level then
    insert into public.notifications(user_id, type, title, body)
    values (_user_id, 'level_up', 'Level up!', 'You reached level ' || new_level);
  end if;

  if next_streak > cur_streak and next_streak in (3,7,14,30,60,100) then
    insert into public.notifications(user_id, type, title, body)
    values (_user_id, 'streak_reward', 'Streak reward', next_streak || '-day streak! Keep it going.');
  end if;
end;
$$;

-- Solve challenge: validates and awards XP
create or replace function public.solve_challenge(_challenge_id uuid, _answer text, _time_taken_ms int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ch record; is_correct boolean; existed boolean;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into ch from public.challenges where id = _challenge_id;
  if not found then raise exception 'challenge not found'; end if;

  is_correct := (lower(trim(_answer)) = lower(trim(ch.answer)));

  begin
    insert into public.challenge_solves(challenge_id, user_id, correct, time_taken_ms)
    values (_challenge_id, uid, is_correct, _time_taken_ms);
    existed := false;
  exception when unique_violation then
    existed := true;
  end;

  if is_correct and not existed then
    update public.challenges set solved_count = solved_count + 1 where id = _challenge_id;
    perform public.award_xp(uid, ch.reward_xp, 'challenge_solve');
  end if;

  return jsonb_build_object('correct', is_correct, 'reward', case when is_correct and not existed then ch.reward_xp else 0 end);
end;
$$;

-- Maintain like/comment/repost counters
create or replace function public.bump_count() returns trigger language plpgsql as $$
declare col text; pid uuid; delta int;
begin
  if tg_argv[0] = 'likes' then col := 'likes_count';
  elsif tg_argv[0] = 'comments' then col := 'comments_count';
  else col := 'reposts_count'; end if;

  if tg_op = 'INSERT' then pid := new.post_id; delta := 1;
  else pid := old.post_id; delta := -1; end if;

  execute format('update public.posts set %I = greatest(0, %I + $1) where id = $2', col, col)
    using delta, pid;
  return null;
end;
$$;

create trigger likes_count_trg after insert or delete on public.likes
for each row execute function public.bump_count('likes');
create trigger comments_count_trg after insert or delete on public.comments
for each row execute function public.bump_count('comments');
create trigger reposts_count_trg after insert or delete on public.reposts
for each row execute function public.bump_count('reposts');

-- Notify on like/comment/repost
create or replace function public.notify_engagement() returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; actor uuid := new.user_id; t notif_type; title text;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is null or owner = actor then return new; end if;
  if tg_argv[0] = 'like' then t := 'like'; title := 'liked your post';
  elsif tg_argv[0] = 'comment' then t := 'comment'; title := 'commented on your post';
  else t := 'repost'; title := 'reposted you'; end if;
  insert into public.notifications(user_id, actor_id, type, title, link)
  values (owner, actor, t, title, '/post/' || new.post_id);
  return new;
end;
$$;
create trigger notify_like after insert on public.likes for each row execute function public.notify_engagement('like');
create trigger notify_comment after insert on public.comments for each row execute function public.notify_engagement('comment');
create trigger notify_repost after insert on public.reposts for each row execute function public.notify_engagement('repost');

-- Matchmaking: join queue and try to pair
create or replace function public.join_duel_queue() returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); other uuid; new_duel uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  -- look for someone else in queue
  select user_id into other from public.duel_queue where user_id <> uid order by joined_at asc limit 1;
  if other is not null then
    delete from public.duel_queue where user_id in (uid, other);
    insert into public.duels(player_a, player_b, status) values (other, uid, 'active') returning id into new_duel;
    insert into public.notifications(user_id, actor_id, type, title, link) values
      (other, uid, 'duel_invite', 'Duel started', '/arena/' || new_duel),
      (uid, other, 'duel_invite', 'Duel started', '/arena/' || new_duel);
    return jsonb_build_object('matched', true, 'duel_id', new_duel);
  else
    insert into public.duel_queue(user_id) values (uid) on conflict (user_id) do nothing;
    return jsonb_build_object('matched', false);
  end if;
end;
$$;

-- Resolve duel & award XP
create or replace function public.finish_duel(_duel_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare d record;
begin
  select * into d from public.duels where id = _duel_id for update;
  if d.status = 'finished' then return; end if;
  update public.duels set status='finished', finished_at=now(),
    winner_id = case when d.score_a > d.score_b then d.player_a
                     when d.score_b > d.score_a then d.player_b else null end
  where id = _duel_id;

  if d.score_a <> d.score_b then
    if d.score_a > d.score_b then
      update public.profiles set wins = wins + 1 where id = d.player_a;
      update public.profiles set losses = losses + 1 where id = d.player_b;
      perform public.award_xp(d.player_a, 50, 'duel_win');
      insert into public.notifications(user_id, actor_id, type, title, body) values
        (d.player_a, d.player_b, 'duel_win', 'You won a duel!', 'Final ' || d.score_a || ' - ' || d.score_b),
        (d.player_b, d.player_a, 'duel_loss', 'You lost a duel', 'Final ' || d.score_b || ' - ' || d.score_a);
    else
      update public.profiles set wins = wins + 1 where id = d.player_b;
      update public.profiles set losses = losses + 1 where id = d.player_a;
      perform public.award_xp(d.player_b, 50, 'duel_win');
      insert into public.notifications(user_id, actor_id, type, title, body) values
        (d.player_b, d.player_a, 'duel_win', 'You won a duel!', 'Final ' || d.score_b || ' - ' || d.score_a),
        (d.player_a, d.player_b, 'duel_loss', 'You lost a duel', 'Final ' || d.score_a || ' - ' || d.score_b);
    end if;
  end if;
end;
$$;

-- =========================================
-- REALTIME
-- =========================================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.reposts;
alter publication supabase_realtime add table public.duels;
alter publication supabase_realtime add table public.duel_rounds;
alter publication supabase_realtime add table public.duel_queue;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.profiles;
