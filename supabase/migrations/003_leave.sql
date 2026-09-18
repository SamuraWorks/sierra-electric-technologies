-- ============================================================
-- Sierra Electric Technologies HRM — Leave management
-- Run AFTER 001_base_roles_demo.sql and 002_seed_staff.sql.
-- Idempotent.
-- ============================================================

-- ============================================================
-- LEAVE TYPES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,
  slug         TEXT NOT NULL UNIQUE,
  default_days INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Anyone can view leave types" ON public.leave_types; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "HR can manage leave types" ON public.leave_types; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Anyone can view leave types" ON public.leave_types FOR SELECT USING (is_active = true);
CREATE POLICY "HR can manage leave types" ON public.leave_types FOR ALL USING (public.user_has_permission('leave.manage'));

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id  UUID NOT NULL REFERENCES public.leave_types(id),
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  reason         TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by    UUID REFERENCES auth.users(id),
  reviewed_at    TIMESTAMPTZ,
  review_note    TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  CHECK (end_date >= start_date)
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can view own leave requests" ON public.leave_requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can create own leave requests" ON public.leave_requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "People ops can view leave requests" ON public.leave_requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Approvers can review leave requests" ON public.leave_requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can view own leave requests" ON public.leave_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own leave requests" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "People ops can view leave requests" ON public.leave_requests FOR SELECT USING (public.user_has_any_permission(ARRAY['leave.view', 'leave.manage', 'leave.approve']));
CREATE POLICY "Approvers can review leave requests" ON public.leave_requests FOR UPDATE USING (public.user_has_permission('leave.approve'));
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
DO $$ BEGIN
  DROP TRIGGER IF EXISTS leave_requests_updated_at ON public.leave_requests;
  CREATE TRIGGER leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- SEED LEAVE TYPES
-- ============================================================
INSERT INTO public.leave_types (name, slug, default_days) VALUES
  ('Annual Leave', 'annual', 24),
  ('Sick Leave', 'sick', 10),
  ('Maternity Leave', 'maternity', 90),
  ('Paternity Leave', 'paternity', 5),
  ('Casual Leave', 'casual', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED SAMPLE LEAVE REQUESTS (for a populated demo)
-- ============================================================
DO $$
DECLARE
  v_user  uuid;
  v_type  uuid;
  v_hr    uuid;
  r       record;
BEGIN
  SELECT id INTO v_hr FROM auth.users WHERE email = 'hr@syscendhrm.test';

  FOR r IN SELECT * FROM (VALUES
    ('employee@syscendhrm.test', 'annual',  CURRENT_DATE - 14, CURRENT_DATE - 7, 'Family visit upcountry', 'approved'),
    ('employee@syscendhrm.test', 'sick',   CURRENT_DATE - 4,  CURRENT_DATE - 3, 'Malaria',               'approved'),
    ('fatmata.kamara@sierraelectric.sl', 'annual', CURRENT_DATE + 20, CURRENT_DATE + 24, 'Wedding in Bo', 'pending'),
    ('ibrahim.sesay@sierraelectric.sl', 'casual', CURRENT_DATE + 5, CURRENT_DATE + 5, 'Personal errand', 'pending'),
    ('mariama.johnson@sierraelectric.sl', 'annual', CURRENT_DATE - 30, CURRENT_DATE - 10, 'Annual leave', 'approved')
  ) AS d(user_email, type_slug, start_date, end_date, reason, status)
  LOOP
    SELECT id INTO v_user FROM auth.users WHERE email = r.user_email;
    CONTINUE WHEN v_user IS NULL;
    SELECT id INTO v_type FROM public.leave_types WHERE slug = r.type_slug;
    CONTINUE WHEN v_type IS NULL;

    INSERT INTO public.leave_requests (user_id, leave_type_id, start_date, end_date, reason, status, reviewed_by, reviewed_at)
    VALUES (
      v_user, v_type, r.start_date, r.end_date, r.reason,
      CASE WHEN r.status = 'pending' THEN 'pending' ELSE r.status END,
      CASE WHEN r.status = 'pending' THEN NULL ELSE v_hr END,
      CASE WHEN r.status = 'pending' THEN NULL ELSE now() END
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

select 'Leave module ready — leave_types seeded, sample requests added.' as status;