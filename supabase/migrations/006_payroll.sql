-- ============================================================
-- Sierra Electric Technologies HRM — Payroll
-- Run AFTER 001-005. Idempotent.
-- ============================================================

-- ============================================================
-- SALARY CONFIGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.salary_configs (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gross_salary  NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'SLL',
  bank_name     TEXT,
  bank_account  TEXT,
  updated_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.salary_configs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Finance can view salary configs" ON public.salary_configs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Finance can manage salary configs" ON public.salary_configs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Finance can view salary configs" ON public.salary_configs FOR SELECT USING (public.user_has_permission('payroll.view'));
CREATE POLICY "Finance can manage salary configs" ON public.salary_configs FOR ALL USING (public.user_has_permission('payroll.run'));

-- ============================================================
-- PAYROLL RUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month        TEXT NOT NULL,                -- e.g. '2026-09'
  label        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'processed'
                 CHECK (status IN ('draft', 'processed', 'paid')),
  created_by   UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (month)
);
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Finance can view payroll runs" ON public.payroll_runs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Finance can create payroll runs" ON public.payroll_runs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Finance can view payroll runs" ON public.payroll_runs FOR SELECT USING (public.user_has_permission('payroll.view'));
CREATE POLICY "Finance can create payroll runs" ON public.payroll_runs FOR INSERT WITH CHECK (public.user_has_permission('payroll.run'));

-- ============================================================
-- PAYROLL ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gross_salary   NUMERIC(14,2) NOT NULL DEFAULT 0,
  deductions     NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_salary     NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'SLL',
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (run_id, user_id)
);
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Finance can view payroll entries" ON public.payroll_entries; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Finance can create payroll entries" ON public.payroll_entries; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Finance can view payroll entries" ON public.payroll_entries FOR SELECT USING (public.user_has_permission('payroll.view'));
CREATE POLICY "Finance can create payroll entries" ON public.payroll_entries FOR INSERT WITH CHECK (public.user_has_permission('payroll.run'));
CREATE INDEX IF NOT EXISTS idx_payroll_entries_run ON public.payroll_entries(run_id);

-- ============================================================
-- SEED SALARY CONFIGS (12 staff + 4 demo role accounts)
-- ============================================================
INSERT INTO public.salary_configs (user_id, gross_salary, currency, bank_name, bank_account)
SELECT au.id, s.salary, 'SLL', 'Rokel Commercial Bank', s.acct
FROM (VALUES
  ('samuel540wisesamura@gmail.com', 38000000, 'RCB-1023-4419'),
  ('hr@syscendhrm.test',             32000000, 'RCB-1023-8821'),
  ('manager@syscendhrm.test',        35000000, 'RCB-1023-0174'),
  ('recruiter@syscendhrm.test',      24000000, 'RCB-1023-5502'),
  ('finance@syscendhrm.test',        34000000, 'RCB-1023-7780'),
  ('employee@syscendhrm.test',        8500000, 'RCB-1023-2292'),
  ('fatmata.kamara@sierraelectric.sl', 9000000, 'RCB-1023-3301'),
  ('ibrahim.sesay@sierraelectric.sl', 16000000, 'RCB-1023-4412'),
  ('mariama.johnson@sierraelectric.sl', 10000000, 'RCB-1023-5523'),
  ('mohamed.conteh@sierraelectric.sl', 9500000, 'RCB-1023-6634'),
  ('aminata.bangura@sierraelectric.sl', 9000000, 'RCB-1023-7745'),
  ('sorie.kabba@sierraelectric.sl',   18000000, 'RCB-1023-8856'),
  ('komba.mansaray@sierraelectric.sl', 13000000, 'RCB-1023-9967'),
  ('isatu.fofanah@sierraelectric.sl', 10000000, 'RCB-1023-0078'),
  ('david.koroma@sierraelectric.sl',  8500000, 'RCB-1023-1189'),
  ('hawa.turay@sierraelectric.sl',    11000000, 'RCB-1023-2290')
) AS s(email, salary, acct)
JOIN auth.users au ON au.email = s.email
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- SEED CURRENT MONTH RUN (so payroll page has data on day one)
-- ============================================================
DO $$
DECLARE
  v_run uuid;
  v_month text := to_char(CURRENT_DATE, 'YYYY-MM');
  v_label text := to_char(CURRENT_DATE, 'FMMonth YYYY');
  emp record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.payroll_runs WHERE month = v_month) THEN
    INSERT INTO public.payroll_runs (month, label, status, processed_at)
    VALUES (v_month, v_label, 'paid', now())
    RETURNING id INTO v_run;

    FOR emp IN
      SELECT sc.user_id, sc.gross_salary, sc.currency
      FROM public.salary_configs sc
      JOIN public.profiles p ON p.id = sc.user_id
      WHERE p.employee_id IS NOT NULL
    LOOP
      INSERT INTO public.payroll_entries (run_id, user_id, gross_salary, deductions, net_salary, currency)
      VALUES (
        v_run,
        emp.user_id,
        emp.gross_salary,
        CASE WHEN emp.currency = 'SLL' THEN round(emp.gross_salary * 0.05, 2) ELSE 0 END,
        emp.gross_salary - CASE WHEN emp.currency = 'SLL' THEN round(emp.gross_salary * 0.05, 2) ELSE 0 END,
        emp.currency
      )
      ON CONFLICT (run_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

select 'Payroll module ready — salary configs + current month run seeded.' as status;