CREATE OR REPLACE FUNCTION public.seed_duel_round(_duel_id uuid, _round_number integer DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  d record;
  q record;
  next_round integer;
  new_round_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO d FROM public.duels WHERE id = _duel_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'duel not found'; END IF;
  IF d.status <> 'active' THEN RETURN NULL; END IF;
  IF uid <> d.player_a AND uid <> d.player_b THEN RAISE EXCEPTION 'not a participant'; END IF;

  next_round := COALESCE(_round_number, d.current_round + 1);
  IF next_round < 1 OR next_round > d.total_rounds THEN
    RETURN NULL;
  END IF;

  IF next_round > d.current_round + 1 THEN
    RETURN NULL;
  END IF;

  SELECT id INTO new_round_id
  FROM public.duel_rounds
  WHERE duel_id = _duel_id AND round_number = next_round;

  IF new_round_id IS NOT NULL THEN
    IF d.current_round < next_round THEN
      UPDATE public.duels SET current_round = next_round WHERE id = _duel_id;
    END IF;
    RETURN new_round_id;
  END IF;

  SELECT * INTO q
  FROM public.duel_questions dq
  WHERE NOT EXISTS (
    SELECT 1 FROM public.duel_question_usage u
    WHERE u.duel_id = _duel_id AND u.question_id = dq.id
  )
  ORDER BY dq.used_count ASC, random()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no duel questions available';
  END IF;

  INSERT INTO public.duel_rounds (duel_id, round_number, question, options, answer)
  VALUES (_duel_id, next_round, q.question, q.options, q.answer)
  RETURNING id INTO new_round_id;

  INSERT INTO public.duel_question_usage (duel_id, question_id, round_number)
  VALUES (_duel_id, q.id, next_round)
  ON CONFLICT DO NOTHING;

  UPDATE public.duel_questions SET used_count = used_count + 1 WHERE id = q.id;
  UPDATE public.duels SET current_round = next_round WHERE id = _duel_id;

  RETURN new_round_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.advance_duel_from_round(_duel_id uuid, _round_number integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  d record;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO d FROM public.duels WHERE id = _duel_id FOR UPDATE;
  IF NOT FOUND OR d.status <> 'active' THEN RETURN; END IF;
  IF uid <> d.player_a AND uid <> d.player_b THEN RAISE EXCEPTION 'not a participant'; END IF;
  IF d.current_round <> _round_number THEN RETURN; END IF;

  IF _round_number >= d.total_rounds THEN
    PERFORM public.finish_duel(_duel_id);
  ELSE
    PERFORM public.seed_duel_round(_duel_id, _round_number + 1);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.advance_duel(_duel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE d record;
BEGIN
  SELECT * INTO d FROM public.duels WHERE id = _duel_id FOR UPDATE;
  IF NOT FOUND OR d.status <> 'active' THEN RETURN; END IF;
  PERFORM public.advance_duel_from_round(_duel_id, d.current_round);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_duel_round(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_duel_round(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.advance_duel_from_round(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_duel_round(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_duel_round(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_duel_from_round(uuid, integer) TO authenticated;