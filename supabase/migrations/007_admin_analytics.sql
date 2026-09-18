-- ============================================================
-- 007 — ADMIN ANALYTICS
-- Revenue tracking + partner gigs (inquiries from partners)
-- Powers the admin dashboard cards (total revenue, revenue this
-- month, partner gigs / quick updates) and future admin panels.
--
-- Usage: run in Supabase SQL Editor. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------------
-- REVENUE TRANSACTIONS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revenue_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description   TEXT NOT NULL,
  client_name   TEXT,
  amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'SLL',
  occurred_on   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_transactions_occurred_on ON public.revenue_transactions(occurred_on);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_client_name ON public.revenue_transactions(client_name);

-- ------------------------------------------------------------------
-- PARTNER INQUIRIES (recent gigs from partners that reached out)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_inquiries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name   TEXT NOT NULL,
  contact_name   TEXT,
  contact_email  TEXT,
  contact_phone  TEXT,
  gig_title      TEXT NOT NULL,
  description    TEXT,
  expected_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'SLL',
  status         TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'negotiating', 'won', 'lost')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_inquiries_company ON public.partner_inquiries(company_name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_inquiries_company_gig ON public.partner_inquiries(company_name, gig_title);

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN DROP POLICY IF EXISTS "Finance can view revenue" ON public.revenue_transactions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Finance can view revenue" ON public.revenue_transactions
  FOR SELECT
  USING (public.user_has_any_permission(ARRAY['revenue.view', 'finance.view', 'finance.reports.view', 'reports.view']));

DO $$ BEGIN DROP POLICY IF EXISTS "Leaders can view partner gigs" ON public.partner_inquiries; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Leaders can view partner gigs" ON public.partner_inquiries
  FOR SELECT
  USING (public.user_has_any_permission(ARRAY['partners.view', 'reports.view']));

-- ------------------------------------------------------------------
-- NEW PERMISSIONS FOR RBAC
-- ------------------------------------------------------------------
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES ('revenue.view'), ('partners.view')) AS p(perm)
WHERE r.slug = 'system-admin'
ON CONFLICT (role_id, permission) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, 'revenue.view' FROM public.roles r WHERE r.slug = 'finance'
ON CONFLICT (role_id, permission) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, 'partners.view' FROM public.roles r WHERE r.slug = 'hr-manager'
ON CONFLICT (role_id, permission) DO NOTHING;

-- ------------------------------------------------------------------
-- DEMO DATA (idempotent: only seeds when tables are empty)
-- ------------------------------------------------------------------
INSERT INTO public.revenue_transactions (description, client_name, amount, currency, occurred_on)
SELECT * FROM (VALUES
  ('Grid infrastructure project - phase 1', 'UNDP Sierra Leone', 32500000, 'SLL', '2026-01-18'),
  ('Data centre electrical fit-out', 'Bank of Sierra Leone', 18200000, 'SLL', '2026-03-05'),
  ('Solar mini-grid deployment', 'Ministry of Energy', 45800000, 'SLL', '2026-05-22'),
  ('Server room cooling and power project', 'SierraTel', 21600000, 'SLL', '2026-07-09'),
  ('Industrial estate electrification', 'Business Center Ltd', 12400000, 'SLL', '2026-09-05'),
  ('Retail chain backup power rollout', 'Kool Stores', 8900000, 'SLL', '2026-09-14')
) AS v(description, client_name, amount, currency, occurred_on)
WHERE NOT EXISTS (SELECT 1 FROM public.revenue_transactions);

INSERT INTO public.partner_inquiries (company_name, contact_name, contact_email, contact_phone, gig_title, description, expected_value, currency, status, created_at)
SELECT * FROM (VALUES
  ('AlphaGrid Energy', 'Mohamed Turay', 'mturay@alphagrid.sl', '+232 76 111 001', 'Grid expansion consulting - Makeni', 'Assist with medium-voltage grid extension studies and load modelling.', 25000000, 'SLL', 'negotiating', now() - interval '1 day'),
  ('Freetown City Council', 'Foday Kargbo', 'fkargbo@fcc.gov.sl', '+232 76 111 002', 'Street lighting retrofit - Phase 3', 'LED street lighting retrofit across 12 wards with smart controls.', 40000000, 'SLL', 'new', now() - interval '3 hours'),
  ('GreenSierra Solar', 'Binta Sesay', 'binta@greensierra.sl', '+232 76 111 003', 'Solar mini-grid for rural health clinic', 'Standalone solar hybrid mini-grid plus battery storage.', 15500000, 'SLL', 'won', now() - interval '5 days'),
  ('Bo Industrial Hub', 'Samuel Conteh', 's.conteh@boihub.sl', '+232 76 111 004', 'Substation maintenance contract', 'Annual high-voltage substation maintenance and testing.', 8000000, 'SLL', 'new', now() - interval '2 days'),
  ('Kono Diamond Corp', 'Ishmael Kamara', 'i.kamara@konocorp.sl', '+232 76 111 005', 'Site electrification and wiring', 'Full electrification of off-grid mining support site.', 22000000, 'SLL', 'negotiating', now() - interval '1 day'),
  ('SierraNet Fibre', 'Patricia Williams', 'p.williams@sierranet.sl', '+232 76 111 006', 'Backbone power redundancy', 'Power redundancy design for national fibre backbone POPs.', 11750000, 'SLL', 'lost', now() - interval '9 days')
) AS v(company_name, contact_name, contact_email, contact_phone, gig_title, description, expected_value, currency, status, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.partner_inquiries);