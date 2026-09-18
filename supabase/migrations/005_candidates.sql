-- ============================================================
-- Sierra Electric Technologies HRM — Candidates / Recruitment
-- Run AFTER 001-004. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.candidates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name      TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  phone             TEXT,
  position_applied  TEXT,
  source            TEXT NOT NULL DEFAULT 'website'
                      CHECK (source IN ('website', 'referral', 'job-board', 'walk-in', 'media', 'other')),
  status            TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected')),
  last_contacted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Recruitment can view candidates" ON public.candidates; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Recruitment can manage candidates" ON public.candidates; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Recruitment can view candidates" ON public.candidates FOR SELECT USING (public.user_has_permission('candidates.view'));
CREATE POLICY "Recruitment can manage candidates" ON public.candidates FOR ALL USING (public.user_has_any_permission(ARRAY['candidates.review', 'candidates.shortlist', 'candidates.interview', 'candidates.decide']));
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON public.candidates(position_applied);
DO $$ BEGIN
  DROP TRIGGER IF EXISTS candidates_updated_at ON public.candidates;
  CREATE TRIGGER candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.candidate_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Recruitment can view candidate notes" ON public.candidate_notes; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Recruitment can add candidate notes" ON public.candidate_notes; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Recruitment can view candidate notes" ON public.candidate_notes FOR SELECT USING (public.user_has_permission('candidates.view'));
CREATE POLICY "Recruitment can add candidate notes" ON public.candidate_notes FOR INSERT WITH CHECK (public.user_has_permission('candidates.view'));
CREATE INDEX IF NOT EXISTS idx_candidate_notes_candidate ON public.candidate_notes(candidate_id);

-- ============================================================
-- SEED CANDIDATES
-- ============================================================
INSERT INTO public.candidates (display_name, email, phone, position_applied, source, status, last_contacted_at) VALUES
  ('Abdul Kargbo',     'abdul.kargbo@example.com',     '232 76 501 224', 'Electrical Engineer',        'referral',  'interviewed', now() - interval '3 days'),
  ('Salamatu Koroma',  'salamatu.koroma@example.com',  '232 78 219 803', 'Accounts Officer',           'website',   'shortlisted', now() - interval '2 days'),
  ('Osman Bangura',    'osman.bangura@example.com',    '232 76 990 412', 'Meter Technician',          'job-board', 'new',         NULL),
  ('Mabinty Sesay',    'mabinty.sesay@example.com',    '232 77 334 096', 'Customer Care Officer',     'walk-in',   'new',         NULL),
  ('Alusine Jalloh',   'alusine.jalloh@example.com',   '232 78 665 281', 'Site Supervisor',           'website',   'offered',     now() - interval '5 days'),
  ('Aissata Bah',      'aissata.bah@example.com',      '232 76 120 750', 'Marketing Officer',         'referral',  'hired',       now() - interval '12 days'),
  ('Edward Samura',    'edward.samura@example.com',    '232 77 480 366', 'Electrical Engineer',       'job-board', 'rejected',    now() - interval '9 days'),
  ('Rugiatu Kanu',     'rugiatu.kanu@example.com',     '232 76 311 458', 'HR Officer',                'media',     'shortlisted', now() - interval '1 day')
ON CONFLICT (email) DO NOTHING;

select 'Candidates module ready — 8 seeded applications.' as status;