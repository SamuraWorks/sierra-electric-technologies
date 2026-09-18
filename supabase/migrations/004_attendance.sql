-- ============================================================
-- Sierra Electric Technologies HRM — Attendance
-- Run AFTER 001-003. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in   TIMESTAMPTZ,
  clock_out  TIMESTAMPTZ,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance_records; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can create own attendance" ON public.attendance_records; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can clock in/out own attendance" ON public.attendance_records; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "People ops can view attendance" ON public.attendance_records; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "People ops can manage attendance" ON public.attendance_records; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can view own attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attendance" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can clock in/out own attendance" ON public.attendance_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "People ops can view attendance" ON public.attendance_records FOR SELECT USING (public.user_has_any_permission(ARRAY['attendance.view', 'attendance.manage']));
CREATE POLICY "People ops can manage attendance" ON public.attendance_records FOR ALL USING (public.user_has_permission('attendance.manage'));
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
DO $$ BEGIN
  DROP TRIGGER IF EXISTS attendance_records_updated_at ON public.attendance_records;
  CREATE TRIGGER attendance_records_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- SEED: attendance for today + last 5 workdays (all staff)
-- A few staff marked absent by simply having no row.
-- ============================================================
DO $$
DECLARE
  d    date;
  emp  record;
  skip text[];
BEGIN
  skip := ARRAY[
    'mohamed.conteh@sierraelectric.sl',    -- on site
    'isatu.fofanah@sierraelectric.sl',     -- sick day
    'zainab.sankoh@sierraelectric.sl'      -- field visit
  ];

  FOR d IN
    SELECT day FROM generate_series(CURRENT_DATE - 5, CURRENT_DATE, interval '1 day') AS t(day)
    WHERE EXTRACT(DOW FROM day) BETWEEN 1 AND 5
  LOOP
    FOR emp IN SELECT id FROM public.profiles WHERE employee_id IS NOT NULL
    LOOP
      CONTINUE WHEN d = CURRENT_DATE AND skip @> ARRAY[(
        SELECT email::text FROM auth.users au WHERE au.id = emp.id
      )];

      INSERT INTO public.attendance_records (user_id, date, clock_in, clock_out, note)
      VALUES (
        emp.id,
        d,
        d::timestamptz + time '08:25' + (random() * interval '15 minutes'),
        d::timestamptz + time '17:00' + (random() * interval '30 minutes'),
        NULL
      )
      ON CONFLICT (user_id, date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

select 'Attendance module ready — past 5 workdays seeded.' as status;