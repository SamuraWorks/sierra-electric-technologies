-- ============================================================
-- Sierra Electric Technologies HRM — Base Schema + Roles + Demo Users
-- Run in Supabase SQL Editor. Idempotent — safe to re-run.
--
-- Creates:
--   * profiles (extends auth.users)
--   * roles, role_permissions, user_roles (RBAC)
--   * helper SQL functions (user_has_permission, user_role_slugs, etc.)
--   * 6 roles with permission matrix (Admin, HR Manager, Manager,
--     Recruiter, Finance, Employee)
--   * 6 demo users, one per role (shared password: Demo@1234)
-- ============================================================

-- Ensure password hashing available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- HELPER FUNCTIONS (used by RLS + grant on auth.users insert)
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_has_permission(check_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND rp.permission = check_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_any_permission(check_permissions TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND rp.permission = ANY(check_permissions)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_role_slugs()
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT r.slug
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
    ORDER BY r.hierarchy_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_role_slug(check_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.slug = check_slug
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, previous_value, new_value)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_previous_value, p_new_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, employee_id)
  VALUES (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT '',
  email         TEXT,
  phone         TEXT,
  position      TEXT,
  department    TEXT,
  employee_id   TEXT,
  photo_url     TEXT,
  address       TEXT,
  emergency_contact TEXT,
  date_of_birth DATE,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other', '')),
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Staff can view profiles" ON public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "HR can manage profiles" ON public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff can view profiles" ON public.profiles FOR SELECT USING (public.user_has_any_permission(ARRAY['employees.view', 'employees.manage']));
CREATE POLICY "HR can manage profiles" ON public.profiles FOR ALL USING (public.user_has_permission('employees.manage'));
DO $$ BEGIN
  DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
  CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Trigger: auto-create profile on auth signup
DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Grant on auth.users so the trigger can insert
GRANT INSERT ON auth.users TO service_role;
GRANT ALL ON public.profiles TO service_role;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  hierarchy_level INTEGER NOT NULL DEFAULT 99,
  is_administrative BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Anyone can view active roles" ON public.roles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Anyone can view active roles" ON public.roles FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage roles" ON public.roles FOR ALL USING (public.user_has_permission('settings.manage'));
DO $$ BEGIN
  DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
  CREATE TRIGGER roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- ROLE PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id     UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions FOR ALL USING (public.user_has_permission('settings.manage'));
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission);

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id      UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  granted_by   UUID REFERENCES auth.users(id),
  granted_at   TIMESTAMPTZ DEFAULT now(),
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Leaders can view roles" ON public.user_roles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Leaders can view roles" ON public.user_roles FOR SELECT USING (public.user_has_any_permission(ARRAY['roles.view', 'employees.view', 'employees.manage']));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.user_has_permission('roles.assign'));
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active) WHERE is_active = true;
DO $$ BEGIN
  DROP TRIGGER IF EXISTS user_roles_updated_at ON public.user_roles;
  CREATE TRIGGER user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES auth.users(id),
  action       TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    TEXT,
  previous_value JSONB,
  new_value    JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT,
  type       TEXT NOT NULL DEFAULT 'general'
               CHECK (type IN ('general', 'announcement', 'leave', 'payroll', 'application', 'system')),
  is_read    BOOLEAN NOT NULL DEFAULT false,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================
-- SEED ROLES
-- ============================================================
INSERT INTO public.roles (name, slug, description, hierarchy_level, is_administrative) VALUES
  ('System Administrator', 'system-admin', 'Full platform administration — roles, settings, audit', 1, true),
  ('HR Manager', 'hr-manager', 'HR administration, employee records, leave approval, people operations', 2, true),
  ('Manager', 'manager', 'Team oversight — attendance and leave approval for direct reports', 3, false),
  ('Recruiter', 'recruiter', 'Recruitment and candidate pipeline management', 4, false),
  ('Finance', 'finance', 'Payroll, expenses and financial reporting', 5, true),
  ('Employee', 'employee', 'Standard staff member — self-service portal', 99, false)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED ROLE PERMISSIONS (per matrix in lib/hrm/permissions.ts)
-- ============================================================
-- System Administrator
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('employees.view'), ('employees.manage'),
  ('roles.view'), ('roles.assign'), ('roles.remove'),
  ('candidates.view'), ('candidates.review'), ('candidates.shortlist'), ('candidates.interview'), ('candidates.decide'),
  ('attendance.view'), ('attendance.manage'),
  ('leave.view'), ('leave.manage'), ('leave.approve'),
  ('payroll.view'), ('payroll.run'),
  ('finance.view'), ('finance.expenses.create'), ('finance.expenses.approve'), ('finance.reports.view'),
  ('training.view'), ('training.manage'),
  ('performance.view'), ('performance.manage'),
  ('documents.view'), ('documents.manage'),
  ('announcements.view'), ('announcements.create'),
  ('reports.view'),
  ('audit.view'), ('settings.manage')
) AS p(perm) WHERE r.slug = 'system-admin'
ON CONFLICT (role_id, permission) DO NOTHING;

-- HR Manager
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('employees.view'), ('employees.manage'),
  ('candidates.view'), ('candidates.review'), ('candidates.shortlist'), ('candidates.interview'), ('candidates.decide'),
  ('attendance.view'), ('attendance.manage'),
  ('leave.view'), ('leave.manage'), ('leave.approve'),
  ('payroll.view'),
  ('finance.view'),
  ('training.view'), ('training.manage'),
  ('performance.view'), ('performance.manage'),
  ('documents.view'), ('documents.manage'),
  ('announcements.view'), ('announcements.create'),
  ('reports.view')
) AS p(perm) WHERE r.slug = 'hr-manager'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Manager
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('employees.view'),
  ('attendance.view'), ('attendance.manage'),
  ('leave.view'), ('leave.approve'),
  ('performance.view'),
  ('announcements.view'),
  ('reports.view')
) AS p(perm) WHERE r.slug = 'manager'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Recruiter
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('employees.view'),
  ('candidates.view'), ('candidates.review'), ('candidates.shortlist'), ('candidates.interview'), ('candidates.decide'),
  ('announcements.view')
) AS p(perm) WHERE r.slug = 'recruiter'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Finance
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('employees.view'),
  ('payroll.view'), ('payroll.run'),
  ('finance.view'), ('finance.expenses.create'), ('finance.expenses.approve'), ('finance.reports.view'),
  ('documents.view'),
  ('announcements.view'),
  ('reports.view')
) AS p(perm) WHERE r.slug = 'finance'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Employee
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('attendance.view'),
  ('leave.view'),
  ('performance.view'),
  ('documents.view'),
  ('announcements.view')
) AS p(perm) WHERE r.slug = 'employee'
ON CONFLICT (role_id, permission) DO NOTHING;

-- ============================================================
-- SEED DEMO USERS (one login per role)
-- Shared password: Demo@1234
-- ============================================================
-- | role            | email                       | login name           | employee_id |
-- |-----------------|-----------------------------|----------------------|-------------|
-- | system-admin    | admin@sierraelectric.sl     | System Admin Demo    | SET-0001    |
-- | hr-manager      | hr@syscendhrm.test          | HR Manager Demo      | SET-0002    |
-- | manager         | manager@syscendhrm.test     | Manager Demo         | SET-0003    |
-- | recruiter       | recruiter@syscendhrm.test   | Recruiter Demo       | SET-0004    |
-- | finance         | finance@syscendhrm.test     | Finance Demo         | SET-0005    |
-- | employee        | employee@syscendhrm.test    | Employee Demo        | SET-0006    |

DO $$
DECLARE
  v_id   uuid;
  v_role uuid;
  u      record;
BEGIN
  FOR u IN SELECT * FROM (VALUES
    ('system-admin', 'admin@sierraelectric.sl', 'System Admin Demo', 'SET-0001'),
    ('hr-manager', 'hr@syscendhrm.test', 'HR Manager Demo', 'SET-0002'),
    ('manager', 'manager@syscendhrm.test', 'Manager Demo', 'SET-0003'),
    ('recruiter', 'recruiter@syscendhrm.test', 'Recruiter Demo', 'SET-0004'),
    ('finance', 'finance@syscendhrm.test', 'Finance Demo', 'SET-0005'),
    ('employee', 'employee@syscendhrm.test', 'Employee Demo', 'SET-0006')
  ) AS d(role_slug, email, display_name, employee_id)
  LOOP
    CONTINUE WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.email = u.email);

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, email_change,
      email_change_token_new, recovery_token, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated', u.email,
      crypt('Demo@1234', gen_salt('bf')),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', u.display_name),
      now(), now()
    ) RETURNING id INTO v_id;

    INSERT INTO auth.identities (
      id, user_id, provider, provider_id, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_id, 'email', v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', u.email),
      now(), now(), now()
    );

    UPDATE public.profiles
    SET email = u.email,
        display_name = u.display_name,
        employee_id = u.employee_id,
        must_change_password = false
    WHERE id = v_id;

    SELECT id INTO v_role FROM public.roles WHERE slug = u.role_slug;

    INSERT INTO public.user_roles (user_id, role_id, is_active)
    VALUES (v_id, v_role, true);

  END LOOP;
END $$;

select 'Sierra Electric HRM base schema seeded. Demo password for all seeded users: Demo@1234' as status;