CREATE OR REPLACE FUNCTION public.bump_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

REVOKE EXECUTE ON FUNCTION public.bump_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_engagement() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.solve_challenge(uuid, text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_duel_queue() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_school_leaderboard() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resolve_duel_round(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.finish_duel(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.advance_duel(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.touch_presence() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_duel_round(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.solve_challenge(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_duel_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_school_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_duel_round(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_duel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_duel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_presence() TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_duel_round(uuid) TO authenticated;