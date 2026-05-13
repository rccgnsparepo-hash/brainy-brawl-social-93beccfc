
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS chat_bg_url text;

DO $$ BEGIN
  CREATE TYPE public.message_kind AS ENUM ('text','image','video','file','voice','view_once');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS kind public.message_kind NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_mime text,
  ADD COLUMN IF NOT EXISTS media_size bigint,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz;

CREATE OR REPLACE FUNCTION public.resolve_duel_round(_round_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record; d record; w uuid; da int := 0; db int := 0; ta double precision; tb double precision;
BEGIN
  SELECT * INTO r FROM public.duel_rounds WHERE id = _round_id FOR UPDATE;
  IF NOT FOUND OR r.winner IS NOT NULL THEN RETURN; END IF;
  SELECT * INTO d FROM public.duels WHERE id = r.duel_id FOR UPDATE;
  IF d.status <> 'active' THEN RETURN; END IF;

  ta := CASE WHEN r.answer_a = r.answer THEN COALESCE(EXTRACT(EPOCH FROM r.answered_at_a), 1e18) ELSE 1e18 END;
  tb := CASE WHEN r.answer_b = r.answer THEN COALESCE(EXTRACT(EPOCH FROM r.answered_at_b), 1e18) ELSE 1e18 END;

  IF ta < tb THEN w := d.player_a; da := 1;
  ELSIF tb < ta THEN w := d.player_b; db := 1;
  ELSIF ta < 1e17 AND tb < 1e17 THEN da := 1; db := 1;
  END IF;

  UPDATE public.duel_rounds SET winner = w WHERE id = r.id;
  IF da > 0 OR db > 0 THEN
    UPDATE public.duels SET score_a = score_a + da, score_b = score_b + db WHERE id = d.id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.advance_duel(_duel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE d record; n int;
BEGIN
  SELECT * INTO d FROM public.duels WHERE id = _duel_id FOR UPDATE;
  IF NOT FOUND OR d.status <> 'active' THEN RETURN; END IF;
  n := d.current_round + 1;
  IF n > d.total_rounds THEN
    PERFORM public.finish_duel(_duel_id);
    RETURN;
  END IF;
  UPDATE public.duels SET current_round = n WHERE id = _duel_id;
END $$;

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-backgrounds','chat-backgrounds',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media','chat-media',false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars owner upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars owner update" ON storage.objects;
DROP POLICY IF EXISTS "avatars owner delete" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars owner upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars owner update" ON storage.objects FOR UPDATE USING (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars owner delete" ON storage.objects FOR DELETE USING (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "chatbg public read" ON storage.objects;
DROP POLICY IF EXISTS "chatbg owner write" ON storage.objects;
DROP POLICY IF EXISTS "chatbg owner update" ON storage.objects;
DROP POLICY IF EXISTS "chatbg owner delete" ON storage.objects;
CREATE POLICY "chatbg public read" ON storage.objects FOR SELECT USING (bucket_id = 'chat-backgrounds');
CREATE POLICY "chatbg owner write" ON storage.objects FOR INSERT WITH CHECK (bucket_id='chat-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chatbg owner update" ON storage.objects FOR UPDATE USING (bucket_id='chat-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chatbg owner delete" ON storage.objects FOR DELETE USING (bucket_id='chat-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "chatmedia participants read" ON storage.objects;
DROP POLICY IF EXISTS "chatmedia participants write" ON storage.objects;
DROP POLICY IF EXISTS "chatmedia participants update" ON storage.objects;
CREATE POLICY "chatmedia participants read" ON storage.objects FOR SELECT USING (
  bucket_id='chat-media' AND auth.uid()::text = ANY(string_to_array((storage.foldername(name))[1], '__'))
);
CREATE POLICY "chatmedia participants write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id='chat-media' AND auth.uid()::text = ANY(string_to_array((storage.foldername(name))[1], '__'))
);
CREATE POLICY "chatmedia participants update" ON storage.objects FOR UPDATE USING (
  bucket_id='chat-media' AND auth.uid()::text = ANY(string_to_array((storage.foldername(name))[1], '__'))
);

NOTIFY pgrst, 'reload schema';
