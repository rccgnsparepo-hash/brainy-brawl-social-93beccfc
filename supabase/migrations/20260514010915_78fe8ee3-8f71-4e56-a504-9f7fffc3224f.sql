-- Connect posts to challenges/duels so embedded feed queries work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_challenge_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_challenge_id_fkey
      FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_duel_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_duel_id_fkey
      FOREIGN KEY (duel_id) REFERENCES public.duels(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Track who is actually active in-app for matchmaking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON public.profiles(last_seen_at DESC);

-- Harder duel question bank managed by the database
CREATE TABLE IF NOT EXISTS public.duel_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'mixed',
  difficulty public.difficulty NOT NULL DEFAULT 'hard',
  question text NOT NULL UNIQUE,
  options text[] NOT NULL,
  answer text NOT NULL,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.duel_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='duel_questions' AND policyname='duel questions readable'
  ) THEN
    CREATE POLICY "duel questions readable"
    ON public.duel_questions
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.duel_question_usage (
  duel_id uuid NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.duel_questions(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (duel_id, question_id),
  UNIQUE (duel_id, round_number)
);

ALTER TABLE public.duel_question_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='duel_question_usage' AND policyname='duel usage readable'
  ) THEN
    CREATE POLICY "duel usage readable"
    ON public.duel_question_usage
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.duels d
        WHERE d.id = duel_question_usage.duel_id
          AND (d.player_a = auth.uid() OR d.player_b = auth.uid())
      )
    );
  END IF;
END $$;

INSERT INTO public.duel_questions (category, difficulty, question, options, answer)
VALUES
  ('math', 'hard', 'A sequence is defined by a₁ = 3 and aₙ = 2aₙ₋₁ + 1. What is a₅?', ARRAY['63','79','95','127'], '63'),
  ('logic', 'hard', 'If all Bloops are Razzies and no Razzies are Lazzies, which must be true?', ARRAY['No Bloops are Lazzies','All Lazzies are Bloops','Some Bloops are Lazzies','No Razzies are Bloops'], 'No Bloops are Lazzies'),
  ('science', 'hard', 'Which organelle is the main site of ATP production in eukaryotic cells?', ARRAY['Ribosome','Mitochondrion','Golgi apparatus','Nucleus'], 'Mitochondrion'),
  ('math', 'hard', 'What is the next prime after 89?', ARRAY['91','93','97','101'], '97'),
  ('history', 'hard', 'The Treaty of Versailles was signed in which year?', ARRAY['1918','1919','1920','1921'], '1919'),
  ('logic', 'hard', 'A clock shows 3:15. What is the smaller angle between the hands?', ARRAY['0°','7.5°','15°','22.5°'], '7.5°'),
  ('math', 'hard', 'If x + 1/x = 5, what is x² + 1/x²?', ARRAY['21','23','25','27'], '23'),
  ('science', 'hard', 'What type of bond involves the sharing of electron pairs between atoms?', ARRAY['Ionic','Covalent','Metallic','Hydrogen'], 'Covalent'),
  ('geography', 'hard', 'Which country has the most time zones including overseas territories?', ARRAY['Russia','United States','France','China'], 'France'),
  ('literature', 'hard', 'In Animal Farm, which historical figure is Napoleon commonly interpreted to represent?', ARRAY['Lenin','Trotsky','Stalin','Churchill'], 'Stalin'),
  ('math', 'hard', 'What is 2⁸ + 3⁴?', ARRAY['337','341','345','349'], '337'),
  ('logic', 'hard', 'If 5 machines make 5 widgets in 5 minutes, how long do 100 machines take to make 100 widgets?', ARRAY['5 minutes','20 minutes','100 minutes','500 minutes'], '5 minutes'),
  ('science', 'hard', 'Which law states that pressure and volume of a gas are inversely proportional at constant temperature?', ARRAY['Charles’s law','Boyle’s law','Avogadro’s law','Ohm’s law'], 'Boyle’s law'),
  ('math', 'hard', 'A triangle has sides 9, 12, and 15. What is its area?', ARRAY['36','45','54','60'], '54'),
  ('logic', 'hard', 'What comes next: 2, 6, 12, 20, 30, ?', ARRAY['40','42','44','48'], '42'),
  ('science', 'hard', 'Which particle has a negative electric charge?', ARRAY['Proton','Neutron','Electron','Nucleus'], 'Electron'),
  ('math', 'hard', 'If log₂(x) = 6, what is x?', ARRAY['12','32','64','128'], '64'),
  ('geography', 'hard', 'What is the deepest known point in Earth’s oceans?', ARRAY['Puerto Rico Trench','Mariana Trench','Java Trench','Tonga Trench'], 'Mariana Trench'),
  ('history', 'hard', 'Who was the first emperor of the Roman Empire?', ARRAY['Julius Caesar','Augustus','Nero','Trajan'], 'Augustus'),
  ('logic', 'hard', 'A bat and ball cost $1.10 total. The bat costs $1 more than the ball. What does the ball cost?', ARRAY['$0.05','$0.10','$0.15','$0.20'], '$0.05')
ON CONFLICT (question) DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  UPDATE public.profiles SET last_seen_at = now(), updated_at = now() WHERE id = uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_duel_round(_duel_id uuid)
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

  next_round := d.current_round + 1;
  IF next_round > d.total_rounds THEN
    PERFORM public.finish_duel(_duel_id);
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.duel_rounds WHERE duel_id = _duel_id AND round_number = next_round) THEN
    SELECT id INTO new_round_id FROM public.duel_rounds WHERE duel_id = _duel_id AND round_number = next_round;
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

CREATE OR REPLACE FUNCTION public.join_duel_queue()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); other uuid; new_duel uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  UPDATE public.profiles SET last_seen_at = now(), updated_at = now() WHERE id = uid;
  DELETE FROM public.duel_queue dq
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = dq.user_id AND p.last_seen_at > now() - interval '45 seconds'
  );

  SELECT dq.user_id INTO other
  FROM public.duel_queue dq
  JOIN public.profiles p ON p.id = dq.user_id
  WHERE dq.user_id <> uid
    AND p.last_seen_at > now() - interval '45 seconds'
  ORDER BY dq.joined_at ASC
  LIMIT 1;

  IF other IS NOT NULL THEN
    DELETE FROM public.duel_queue WHERE user_id IN (uid, other);
    INSERT INTO public.duels(player_a, player_b, status, current_round, total_rounds)
    VALUES (other, uid, 'active', 0, 5)
    RETURNING id INTO new_duel;

    INSERT INTO public.notifications(user_id, actor_id, type, title, link) VALUES
      (other, uid, 'duel_invite', 'Duel started', '/duel/' || new_duel),
      (uid, other, 'duel_invite', 'Duel started', '/duel/' || new_duel);

    RETURN jsonb_build_object('matched', true, 'duel_id', new_duel);
  END IF;

  INSERT INTO public.duel_queue(user_id) VALUES (uid)
  ON CONFLICT (user_id) DO UPDATE SET joined_at = now();

  RETURN jsonb_build_object('matched', false);
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
  IF d.current_round >= d.total_rounds THEN
    PERFORM public.finish_duel(_duel_id);
  ELSE
    PERFORM public.seed_duel_round(_duel_id);
  END IF;
END;
$$;

-- Ensure key tables are in realtime publication (ignore if already added)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['posts','challenges','likes','comments','reposts','duels','duel_rounds','messages','profiles','notifications','duel_queue'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;