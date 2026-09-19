-- ============================================================
-- 011 — ANNOUNCEMENTS ENGAGEMENT
-- Reactions + comments on announcements, with moderation.
-- Idempotent; safe to re-run.
-- ============================================================

-- ------------------------------------------------------------------
-- ANNOUNCEMENT REACTIONS (emoji, one per user+emoji per announcement)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcement_reactions (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji           TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id, emoji)
);

ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN DROP POLICY IF EXISTS "Announcement reactions readable by staff" ON public.announcement_reactions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Anyone can react to announcements" ON public.announcement_reactions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Anyone can remove own reaction" ON public.announcement_reactions; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Announcement reactions readable by staff" ON public.announcement_reactions FOR SELECT
  USING (public.user_has_any_permission(ARRAY['announcements.view', 'announcements.create', 'announcements.manage']));

CREATE POLICY "Anyone can react to announcements" ON public.announcement_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_any_permission(ARRAY['announcements.view', 'announcements.create', 'announcements.manage'])
  );

CREATE POLICY "Anyone can remove own reaction" ON public.announcement_reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_announcement_reactions_announcement ON public.announcement_reactions(announcement_id);

-- ------------------------------------------------------------------
-- ANNOUNCEMENT COMMENTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcement_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN DROP POLICY IF EXISTS "Announcement comments readable by staff" ON public.announcement_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Anyone can comment on announcements" ON public.announcement_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Authors can edit own comments" ON public.announcement_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Anyone can delete own comments" ON public.announcement_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Managers can moderate comments" ON public.announcement_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Announcement comments readable by staff" ON public.announcement_comments FOR SELECT
  USING (public.user_has_any_permission(ARRAY['announcements.view', 'announcements.create', 'announcements.manage']));

CREATE POLICY "Anyone can comment on announcements" ON public.announcement_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_any_permission(ARRAY['announcements.view', 'announcements.create', 'announcements.manage'])
  );

CREATE POLICY "Authors can edit own comments" ON public.announcement_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can delete own comments" ON public.announcement_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can moderate comments" ON public.announcement_comments FOR DELETE
  USING (public.user_has_any_permission(ARRAY['announcements.manage']));

CREATE INDEX IF NOT EXISTS idx_announcement_comments_announcement ON public.announcement_comments(announcement_id, created_at);

select 'Announcements engagement ready — reactions + comments.' as status;