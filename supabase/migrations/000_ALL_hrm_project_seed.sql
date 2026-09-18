

-- >>>>>>>>>> FILE: 001_base_roles_demo.sql <<<<<<<<<<

-- ============================================================
-- Sierra Electric Technologies HRM â€” Base Schema + Roles + Demo Users
-- Run in Supabase SQL Editor. Idempotent â€” safe to re-run.
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
  ('System Administrator', 'system-admin', 'Full platform administration â€” roles, settings, audit', 1, true),
  ('HR Manager', 'hr-manager', 'HR administration, employee records, leave approval, people operations', 2, true),
  ('Manager', 'manager', 'Team oversight â€” attendance and leave approval for direct reports', 3, false),
  ('Recruiter', 'recruiter', 'Recruitment and candidate pipeline management', 4, false),
  ('Finance', 'finance', 'Payroll, expenses and financial reporting', 5, true),
  ('Employee', 'employee', 'Standard staff member â€” self-service portal', 99, false)
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
-- | system-admin    | samuel540wisesamura@gmail.com | System Administrator | SET-0001    |
-- | hr-manager      | hr@syscendhrm.test          | HR Manager Demo      | SET-0002    |
-- | manager         | manager@syscendhrm.test     | Manager Demo         | SET-0003    |
-- | recruiter       | recruiter@syscendhrm.test   | Recruiter Demo       | SET-0004    |
-- | finance         | finance@syscendhrm.test     | Finance Demo         | SET-0005    |
-- | employee        | employee@syscendhrm.test    | Employee Demo        | SET-0006    |

-- Shared demo password: Demo@1234
-- System Admin (owner) uses a separate temporary password: SamuraT3mp-2026!

DO $$
DECLARE
  v_id   uuid;
  v_role uuid;
  u      record;
BEGIN
  FOR u IN SELECT * FROM (VALUES
    ('system-admin', 'samuel540wisesamura@gmail.com', 'System Administrator', 'SET-0001', 'SamuraT3mp-2026!'),
    ('hr-manager', 'hr@syscendhrm.test', 'HR Manager Demo', 'SET-0002', 'Demo@1234'),
    ('manager', 'manager@syscendhrm.test', 'Manager Demo', 'SET-0003', 'Demo@1234'),
    ('recruiter', 'recruiter@syscendhrm.test', 'Recruiter Demo', 'SET-0004', 'Demo@1234'),
    ('finance', 'finance@syscendhrm.test', 'Finance Demo', 'SET-0005', 'Demo@1234'),
    ('employee', 'employee@syscendhrm.test', 'Employee Demo', 'SET-0006', 'Demo@1234')
  ) AS d(role_slug, email, display_name, employee_id, seed_password)
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
      crypt(u.seed_password, gen_salt('bf')),
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


-- >>>>>>>>>> FILE: 002_seed_staff.sql <<<<<<<<<<

-- ============================================================
-- Sierra Electric Technologies HRM â€” Seed staff roster
-- Run AFTER 001_base_roles_demo.sql. Idempotent.
--
--   * Gives the 6 seeded demo accounts realistic positions/departments
--   * Adds ~14 additional staff profiles (employee role), so the
--     directory, dashboard counts and roles page look populated
--   * Shared auth password for additional staff: Demo@1234
-- ============================================================

-- Update the seeded demo users with real-looking job data
DO $$
DECLARE
  v_id uuid;
  d    record;
BEGIN
  FOR d IN SELECT * FROM (VALUES
    ('samuel540wisesamura@gmail.com', 'Chief Technology Officer', 'Head Office', '232 76 123 001'),
    ('hr@syscendhrm.test', 'Head of Human Resources', 'Human Resources', '232 76 123 002'),
    ('manager@syscendhrm.test', 'Operations Manager', 'Operations', '232 76 123 003'),
    ('recruiter@syscendhrm.test', 'Talent Acquisition Lead', 'Human Resources', '232 76 123 004'),
    ('finance@syscendhrm.test', 'Finance Manager', 'Finance', '232 76 123 005'),
    ('employee@syscendhrm.test', 'Field Technician', 'Field Services', '232 76 123 006')
  ) AS d(email, position, department, phone)
  LOOP
    SELECT id INTO v_id FROM auth.users WHERE email = d.email;
    CONTINUE WHEN v_id IS NULL;
    UPDATE public.profiles
    SET position = d.position,
        department = d.department,
        phone = d.phone
    WHERE id = v_id;
  END LOOP;
END $$;

-- Additional staff (role: employee)
DO $$
DECLARE
  v_id   uuid;
  v_role uuid;
  s      record;
BEGIN
  SELECT id INTO v_role FROM public.roles WHERE slug = 'employee';

  FOR s IN SELECT * FROM (VALUES
    ('SET-0007', 'Fatmata Kamara', 'fatmata.kamara@sierraelectric.sl', 'Accounts Officer', 'Finance', '232 76 221 904'),
    ('SET-0008', 'Ibrahim Sesay', 'ibrahim.sesay@sierraelectric.sl', 'Electrical Engineer', 'Engineering', '232 78 443 210'),
    ('SET-0009', 'Mariama Johnson', 'mariama.johnson@sierraelectric.sl', 'HR Officer', 'Human Resources', '232 76 882 346'),
    ('SET-0010', 'Mohamed Conteh', 'mohamed.conteh@sierraelectric.sl', 'Senior Lineman', 'Field Services', '232 77 908 113'),
    ('SET-0011', 'Aminata Bangura', 'aminata.bangura@sierraelectric.sl', 'Sales Executive', 'Sales', '232 76 519 772'),
    ('SET-0012', 'Sorie Kabba', 'sorie.kabba@sierraelectric.sl', 'Project Engineer', 'Engineering', '232 78 655 480'),
    ('SET-0013', 'Komba Mansaray', 'komba.mansaray@sierraelectric.sl', 'Site Supervisor', 'Operations', '232 76 744 519'),
    ('SET-0014', 'Isatu Fofanah', 'isatu.fofanah@sierraelectric.sl', 'Payroll Officer', 'Finance', '232 77 300 882'),
    ('SET-0015', 'David Koroma', 'david.koroma@sierraelectric.sl', 'Meter Technician', 'Field Services', '232 76 612 330'),
    ('SET-0016', 'Hawa Turay', 'hawa.turay@sierraelectric.sl', 'Customer Care Lead', 'Sales', '232 78 191 276'),
    ('SET-0017', 'Brian Macauley', 'brian.macauley@sierraelectric.sl', 'Safety Officer', 'Operations', '232 76 830 104'),
    ('SET-0018', 'Zainab Sankoh', 'zainab.sankoh@sierraelectric.sl', 'Marketing Officer', 'Sales', '232 77 294 661'),
    ('SET-0019', 'Emmanuel Tucker', 'emmanuel.tucker@sierraelectric.sl', 'Systems Administrator', 'Engineering', '232 78 428 950'),
    ('SET-0020', 'Mariatu Kargbo', 'mariatu.kargbo@sierraelectric.sl', 'Receptionist', 'Head Office', '232 76 507 813')
  ) AS d(employee_id, display_name, email, position, department, phone)
  LOOP
    CONTINUE WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.email = s.email);

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, email_change,
      email_change_token_new, recovery_token, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated', s.email,
      crypt('Demo@1234', gen_salt('bf')),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', s.display_name),
      now(), now()
    ) RETURNING id INTO v_id;

    INSERT INTO auth.identities (
      id, user_id, provider, provider_id, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_id, 'email', v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', s.email),
      now(), now(), now()
    );

    UPDATE public.profiles
    SET email = s.email,
        display_name = s.display_name,
        employee_id = s.employee_id,
        position = s.position,
        department = s.department,
        phone = s.phone,
        must_change_password = false
    WHERE id = v_id;

    INSERT INTO public.user_roles (user_id, role_id, is_active)
    VALUES (v_id, v_role, true);
  END LOOP;
END $$;

select 'Sierra Electric HRM staff roster seeded (20 staff, 6 role accounts).' as status;


-- >>>>>>>>>> FILE: 003_leave.sql <<<<<<<<<<

-- ============================================================
-- Sierra Electric Technologies HRM â€” Leave management
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

select 'Leave module ready â€” leave_types seeded, sample requests added.' as status;


-- >>>>>>>>>> FILE: 004_attendance.sql <<<<<<<<<<

-- ============================================================
-- Sierra Electric Technologies HRM â€” Attendance
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

select 'Attendance module ready â€” past 5 workdays seeded.' as status;


-- >>>>>>>>>> FILE: 005_candidates.sql <<<<<<<<<<

-- ============================================================
-- Sierra Electric Technologies HRM â€” Candidates / Recruitment
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

select 'Candidates module ready â€” 8 seeded applications.' as status;


-- >>>>>>>>>> FILE: 006_payroll.sql <<<<<<<<<<

-- ============================================================
-- Sierra Electric Technologies HRM â€” Payroll
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

select 'Payroll module ready â€” salary configs + current month run seeded.' as status;


-- >>>>>>>>>> FILE: 007_admin_analytics.sql <<<<<<<<<<

-- ============================================================
-- 007 â€” ADMIN ANALYTICS
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


-- >>>>>>>>>> FILE: 008_staff_operations.sql <<<<<<<<<<

-- ============================================================
-- 008 â€” STAFF & OPERATIONS (Samuel's portal core)
-- Departments, Positions, Projects, Tasks, Work Reports, Payments
-- + new action-based permissions. Idempotent; safe to re-run.
-- ============================================================

-- ------------------------------------------------------------------
-- DEPARTMENTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  head_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------
-- POSITIONS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.positions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL UNIQUE,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  responsibilities TEXT,
  department_id    UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_positions (
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, position_id)
);

-- ------------------------------------------------------------------
-- PROJECTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  lead_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'planning'
                  CHECK (status IN ('planning', 'active', 'on_hold', 'completed')),
  priority      TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high')),
  start_date    DATE,
  target_date   DATE,
  progress      SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_team (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_projects_lead ON public.projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- ------------------------------------------------------------------
-- TASKS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  project_id  UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo', 'in_progress', 'blocked', 'review', 'completed')),
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  due_date    DATE,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- ------------------------------------------------------------------
-- WORK REPORTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.work_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  report_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  work_completed TEXT NOT NULL,
  challenges     TEXT,
  next_steps     TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_reports_profile ON public.work_reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_work_reports_date ON public.work_reports(report_date);

-- ------------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount              NUMERIC(14,2) NOT NULL,
  period_label        TEXT,
  paid_on             DATE NOT NULL DEFAULT CURRENT_DATE,
  method              TEXT,
  reference           TEXT,
  proof_url           TEXT,
  recorded_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  confirmation_status TEXT NOT NULL DEFAULT 'awaiting_confirmation'
                        CHECK (confirmation_status IN ('awaiting_confirmation', 'confirmed', 'disputed', 'resolved')),
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_recipient ON public.payments(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(paid_on);

-- ------------------------------------------------------------------
-- ANNOUNCEMENTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  audience     TEXT NOT NULL DEFAULT 'everyone',
  priority     TEXT NOT NULL DEFAULT 'normal'
                 CHECK (priority IN ('normal', 'high', 'urgent')),
  is_pinned    BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published_at DESC);

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN DROP POLICY IF EXISTS "Departments readable by staff" ON public.departments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Departments readable by staff" ON public.departments FOR SELECT
  USING (public.user_has_any_permission(ARRAY['departments.view', 'departments.manage', 'employees.view']));

DO $$ BEGIN DROP POLICY IF EXISTS "Positions readable by staff" ON public.positions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Positions readable by staff" ON public.positions FOR SELECT
  USING (public.user_has_any_permission(ARRAY['positions.view', 'positions.manage', 'employees.view']));

DO $$ BEGIN DROP POLICY IF EXISTS "Profile positions readable by staff" ON public.profile_positions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Profile positions readable by staff" ON public.profile_positions FOR SELECT
  USING (public.user_has_any_permission(ARRAY['positions.view', 'positions.manage', 'employees.view', 'employees.manage']));

DO $$ BEGIN DROP POLICY IF EXISTS "Projects readable by involved staff" ON public.projects; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Projects readable by involved staff" ON public.projects FOR SELECT
  USING (
    public.user_has_any_permission(ARRAY['projects.view', 'projects.manage'])
    OR EXISTS (SELECT 1 FROM public.project_team pt WHERE pt.project_id = public.projects.id AND pt.profile_id = auth.uid())
    OR public.projects.lead_id = auth.uid()
  );

DO $$ BEGIN DROP POLICY IF EXISTS "Project team readable by involved staff" ON public.project_team; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Project team readable by involved staff" ON public.project_team FOR SELECT
  USING (
    public.user_has_any_permission(ARRAY['projects.view', 'projects.manage'])
    OR profile_id = auth.uid()
  );

DO $$ BEGIN DROP POLICY IF EXISTS "Tasks readable by staff" ON public.tasks; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Tasks readable by staff" ON public.tasks FOR SELECT
  USING (
    public.user_has_any_permission(ARRAY['tasks.view', 'tasks.manage'])
    OR assignee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.project_team pt WHERE pt.project_id = public.tasks.project_id AND pt.profile_id = auth.uid())
  );

DO $$ BEGIN DROP POLICY IF EXISTS "Work reports readable by staff" ON public.work_reports; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Work reports readable by staff" ON public.work_reports FOR SELECT
  USING (
    public.user_has_any_permission(ARRAY['work_reports.view', 'work_reports.manage'])
    OR profile_id = auth.uid()
  );

DO $$ BEGIN DROP POLICY IF EXISTS "Payments readable by staff" ON public.payments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Payments readable by staff" ON public.payments FOR SELECT
  USING (
    public.user_has_any_permission(ARRAY['payments.view', 'payments.manage'])
    OR recipient_id = auth.uid()
  );

DO $$ BEGIN DROP POLICY IF EXISTS "Announcements readable by staff" ON public.announcements; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Announcements readable by staff" ON public.announcements FOR SELECT
  USING (public.user_has_any_permission(ARRAY['announcements.view', 'announcements.create', 'announcements.manage']));

-- ------------------------------------------------------------------
-- NEW PERMISSIONS (action-based)
-- ------------------------------------------------------------------
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('departments.view'), ('departments.manage'),
  ('positions.view'), ('positions.manage'),
  ('projects.view'), ('projects.manage'),
  ('tasks.view'), ('tasks.manage'),
  ('work_reports.view'), ('work_reports.manage'),
  ('payments.view'), ('payments.manage'),
  ('users.manage'),
  ('announcements.manage')
) AS p(perm) WHERE r.slug = 'system-admin'
ON CONFLICT (role_id, permission) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('departments.view'), ('positions.view'), ('projects.view'), ('tasks.view'),
  ('work_reports.view'), ('payments.view'), ('announcements.manage')
) AS p(perm) WHERE r.slug = 'hr-manager'
ON CONFLICT (role_id, permission) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('projects.view'), ('tasks.view'), ('work_reports.view'), ('payments.view'), ('announcements.manage')
) AS p(perm) WHERE r.slug = 'manager'
ON CONFLICT (role_id, permission) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, 'payments.view' FROM public.roles r WHERE r.slug = 'employee'
ON CONFLICT (role_id, permission) DO NOTHING;

-- ------------------------------------------------------------------
-- DEMO DATA (idempotent)
-- ------------------------------------------------------------------
INSERT INTO public.departments (name, slug, description, head_id)
SELECT v.name, v.slug, v.description,
  NULLIF(v.head_employee_id, '')::uuid
FROM (VALUES
  ('Head Office', 'head-office', 'Executive leadership and central administration.',
     (SELECT id::text FROM public.profiles WHERE employee_id = 'SET-0001')),
  ('Human Resources', 'human-resources', 'People operations, hiring and staff wellbeing.',
     (SELECT id::text FROM public.profiles WHERE employee_id = 'SET-0002')),
  ('Engineering', 'engineering', 'Design, deployment and technical delivery.',
     (SELECT id::text FROM public.profiles WHERE employee_id = 'SET-0012')),
  ('Operations', 'operations', 'Day-to-day field and site operations.',
     (SELECT id::text FROM public.profiles WHERE employee_id = 'SET-0013')),
  ('Finance', 'finance', 'Payments, expenses and financial control.',
     (SELECT id::text FROM public.profiles WHERE employee_id = 'SET-0007')),
  ('Field Services', 'field-services', 'Installation, maintenance and metering crews.',
     (SELECT id::text FROM public.profiles WHERE employee_id = 'SET-0010')),
  ('Sales', 'sales', 'Client relationships, sales and customer care.',
     (SELECT id::text FROM public.profiles WHERE employee_id = 'SET-0011'))
) AS v(name, slug, description, head_employee_id)
WHERE NOT EXISTS (SELECT 1 FROM public.departments);

INSERT INTO public.positions (name, slug, description, responsibilities, department_id)
SELECT v.name, v.slug, v.description, v.responsibilities,
  (SELECT id FROM public.departments d WHERE d.slug = v.dept_slug)
FROM (VALUES
  ('Administrator', 'administrator', 'Company administration and operational oversight.', 'Coordinate operations, review approvals, manage company-wide activity.'),
  ('System Administrator', 'system-administrator', 'Owner of the company systems and access.', 'Manage users, roles, permissions, audit log and system settings.'),
  ('Software Engineer', 'software-engineer', 'Builds and maintains company software and platforms.', 'Develop features, fix bugs, ship releases and support internal tools.'),
  ('Electrical Engineer', 'electrical-engineer', 'Electrical design and project engineering.', 'Design systems, supervise installations, ensure quality and safety.'),
  ('Engineering Lead', 'engineering-lead', 'Leads engineering delivery teams.', 'Own technical delivery, review designs and mentor the team.'),
  ('Media Officer', 'media-officer', 'Company communications and media.', 'Produce content, manage channels and support stakeholder communications.'),
  ('Project Engineer', 'project-engineer', 'Engineers assigned to specific projects.', 'Deliver project engineering tasks on schedule and budget.'),
  ('Systems Administrator', 'systems-administrator', 'Maintains IT infrastructure and systems.', 'Manage servers, networks and internal platforms.'),
  ('Finance Manager', 'finance-manager', 'Owns financial planning and control.', 'Oversee payments, expenses, cash flow and financial reports.'),
  ('HR Officer', 'hr-officer', 'Supports people operations.', 'Maintain staff records, leave and payroll inputs.'),
  ('Accounts Officer', 'accounts-officer', 'Processes financial transactions.', 'Record payments, reconcile accounts and support month-end.'),
  ('Site Supervisor', 'site-supervisor', 'Supervises field work at sites.', 'Coordinate crews, enforce safety and report progress.'),
  ('Sales Executive', 'sales-executive', 'Sells company products and services.', 'Win new business and grow existing accounts.'),
  ('Field Technician', 'field-technician', 'Installs and services equipment in the field.', 'Carry out installs, checks and repairs on site.')
) AS v(name, slug, description, responsibilities, dept_slug)
WHERE NOT EXISTS (SELECT 1 FROM public.positions);

-- Personalise the owner account
UPDATE public.profiles
SET display_name = 'Samuel Samura',
    position = 'Administrator'
WHERE email = 'samuel540wisesamura@gmail.com';

-- Link Samuel's three positions
INSERT INTO public.profile_positions (profile_id, position_id)
SELECT p.id, pos.id
FROM public.profiles p
JOIN public.positions pos ON pos.slug IN ('administrator', 'system-administrator', 'software-engineer')
WHERE p.email = 'samuel540wisesamura@gmail.com'
ON CONFLICT (profile_id, position_id) DO NOTHING;

-- Link remaining staff to positions by matching their profile position text
INSERT INTO public.profile_positions (profile_id, position_id)
SELECT p.id, pos.id
FROM public.profiles p
JOIN public.positions pos ON lower(pos.name) = lower(p.position)
WHERE p.position IS NOT NULL AND p.position <> ''
ON CONFLICT (profile_id, position_id) DO NOTHING;

-- Projects
INSERT INTO public.projects (name, description, lead_id, department_id, status, priority, start_date, target_date, progress)
SELECT v.name, v.description,
  (SELECT id FROM public.profiles WHERE employee_id = v.lead_employee_id),
  (SELECT id FROM public.departments d WHERE d.slug = v.dept_slug),
  v.status, v.priority, v.start_date, v.target_date, v.progress
FROM (VALUES
  ('EV Shuttle Project', 'EV shuttle fleet electrification and charging infrastructure for the campus shuttle service.',
    'SET-0008', 'engineering', 'active', 'high', '2026-03-01', '2026-12-15', 45),
  ('Admin Portal & HR Platform', 'Internal staff and operations portal - the system you are using now.',
    'SET-0001', 'engineering', 'active', 'high', '2026-06-01', '2026-11-30', 60),
  ('Solar Mini-Grid Pilot', 'Standalone solar hybrid mini-grid pilot for a rural health clinic.',
    'SET-0013', 'operations', 'active', 'medium', '2026-07-15', '2026-12-31', 25),
  ('Grid Expansion - Makeni', 'Consulting and load modelling for the medium-voltage grid extension in Makeni.',
    'SET-0012', 'engineering', 'planning', 'high', NULL, '2027-02-28', 0),
  ('Street Lighting Retrofit', 'LED street lighting retrofit across pilot wards with smart controls.',
    'SET-0010', 'operations', 'on_hold', 'medium', '2026-04-01', '2026-10-31', 30),
  ('Data Centre Power Redundancy', 'Design and installation of redundant power for the internal data centre.',
    'SET-0012', 'engineering', 'completed', 'medium', '2026-01-10', '2026-06-30', 100)
) AS v(name, description, lead_employee_id, dept_slug, status, priority, start_date, target_date, progress)
WHERE NOT EXISTS (SELECT 1 FROM public.projects)
ON CONFLICT DO NOTHING;

-- Team memberships (Samuel on two projects)
INSERT INTO public.project_team (project_id, profile_id)
SELECT pr.id, p.id
FROM public.projects pr
JOIN public.profiles p ON p.email = 'samuel540wisesamura@gmail.com'
WHERE pr.name IN ('Admin Portal & HR Platform', 'EV Shuttle Project')
ON CONFLICT (project_id, profile_id) DO NOTHING;

INSERT INTO public.project_team (project_id, profile_id)
SELECT pr.id, p.id
FROM public.projects pr
JOIN public.profiles p ON p.employee_id = 'SET-0008'
WHERE pr.name = 'EV Shuttle Project'
ON CONFLICT (project_id, profile_id) DO NOTHING;

INSERT INTO public.project_team (project_id, profile_id)
SELECT pr.id, p.id
FROM public.projects pr
JOIN public.profiles p ON p.employee_id = 'SET-0013'
WHERE pr.name IN ('Solar Mini-Grid Pilot', 'Street Lighting Retrofit')
ON CONFLICT (project_id, profile_id) DO NOTHING;

INSERT INTO public.project_team (project_id, profile_id)
SELECT pr.id, p.id
FROM public.projects pr
JOIN public.profiles p ON p.employee_id = 'SET-0020'
WHERE pr.name = 'EV Shuttle Project'
ON CONFLICT (project_id, profile_id) DO NOTHING;

-- Tasks
INSERT INTO public.tasks (title, description, project_id, assignee_id, status, priority, due_date, created_by)
SELECT v.title, v.description,
  (SELECT id FROM public.projects WHERE name = v.project_name),
  CASE WHEN v.assignee_employee_id IS NULL THEN NULL ELSE (SELECT id FROM public.profiles WHERE employee_id = v.assignee_employee_id) END,
  v.status, v.priority, v.due_date,
  (SELECT id FROM public.profiles WHERE employee_id = 'SET-0001')
FROM (VALUES
  ('Finalize portal sidebar', 'Ship the new Staff & Operations navigation for the portal.', 'Admin Portal & HR Platform', 'SET-0001', 'in_progress', 'high', '2026-09-20'),
  ('Set up partner gigs dashboard', 'Show recent partner gigs on the operations dashboard.', 'Admin Portal & HR Platform', 'SET-0001', 'review', 'medium', '2026-09-16'),
  ('Wire up payments module', 'Build the payments list and record flow.', 'Admin Portal & HR Platform', 'SET-0001', 'todo', 'high', '2026-09-30'),
  ('Charging station specs', 'Finalize specifications for the shuttle charging stations.', 'EV Shuttle Project', 'SET-0008', 'in_progress', 'high', '2026-09-25'),
  ('Shuttle route analysis', 'Survey the shuttle routes and stops for charger placement.', 'EV Shuttle Project', 'SET-0013', 'completed', 'medium', '2026-08-30'),
  ('Clinic load assessment', 'Measure load profile for the clinic mini-grid.', 'Solar Mini-Grid Pilot', 'SET-0013', 'blocked', 'high', '2026-09-18'),
  ('Ward lighting audit', 'Audit existing street lights in the pilot ward.', 'Street Lighting Retrofit', 'SET-0010', 'todo', 'medium', '2026-09-22'),
  ('Makeni stakeholder workshop', 'Run the scoping workshop with local stakeholders.', 'Grid Expansion - Makeni', 'SET-0012', 'todo', 'medium', '2026-10-05'),
  ('Redundancy design review', 'Review completed power redundancy design pack.', 'Data Centre Power Redundancy', 'SET-0012', 'completed', 'medium', '2026-06-01'),
  ('Marketing flyer for shuttle', 'Draft flyer for the shuttle launch.', 'EV Shuttle Project', 'SET-0011', 'in_progress', 'low', '2026-09-19')
) AS v(title, description, project_name, assignee_employee_id, status, priority, due_date)
WHERE NOT EXISTS (SELECT 1 FROM public.tasks)
ON CONFLICT DO NOTHING;

-- Work reports
INSERT INTO public.work_reports (profile_id, project_id, report_date, work_completed, challenges, next_steps)
SELECT p.id, pr.id, v.report_date, v.work_completed, v.challenges, v.next_steps
FROM (VALUES
  ('SET-0008', 'EV Shuttle Project', '2026-09-16', 'Completed the charger location survey and drafted the site plan.', 'Permit approvals for the depot are still pending.', 'Submit site plan and wait for depot permit.'),
  ('SET-0013', 'Solar Mini-Grid Pilot', '2026-09-15', 'Installed the battery rack and ran initial charge cycles on the clinic mini-grid.', 'Inverter firmware is not matching the battery BMS firmware.', 'Coordinate with supplier for a firmware update.'),
  ('SET-0001', 'Admin Portal & HR Platform', '2026-09-14', 'Implemented the operations dashboard cards and partner gigs feed.', 'None significant.', 'Continue with the payments module and profile page.'),
  ('SET-0011', 'EV Shuttle Project', '2026-09-13', 'Collected pricing from two vendors for shuttle branding.', 'Third vendor has not responded.', 'Follow up on vendor quote and update pricing sheet.'),
  ('SET-0012', 'Grid Expansion - Makeni', '2026-09-12', 'Delivered the load-model draft for the grid extension studies.', 'Dataset from the utility is incomplete for two feeder zones.', 'Request the full feeder data and finalize model.')
) AS v(employee_id, project_name, report_date, work_completed, challenges, next_steps)
JOIN public.profiles p ON p.employee_id = v.employee_id
LEFT JOIN public.projects pr ON pr.name = v.project_name
WHERE NOT EXISTS (SELECT 1 FROM public.work_reports);

-- Payments
INSERT INTO public.payments (recipient_id, amount, period_label, paid_on, method, reference, recorded_by, confirmation_status)
SELECT p.id, v.amount, v.period_label, v.paid_on, v.method, v.reference,
  (SELECT id FROM public.profiles WHERE employee_id = 'SET-0001'),
  v.confirmation_status
FROM (VALUES
  ('SET-0012', 14500000, 'August 2026', '2026-09-02', 'bank', 'PMT-2026-0812', 'awaiting_confirmation'),
  ('SET-0001', 22000000, 'August 2026', '2026-09-02', 'bank', 'PMT-2026-0801', 'confirmed'),
  ('SET-0007', 9800000, 'August 2026', '2026-09-02', 'mobile', 'PMT-2026-0807', 'confirmed'),
  ('SET-0014', 8200000, 'August 2026', '2026-09-03', 'bank', 'PMT-2026-0814', 'disputed'),
  ('SET-0010', 10500000, 'August 2026', '2026-09-03', 'mobile', 'PMT-2026-0810', 'confirmed'),
  ('SET-0013', 11800000, 'September 2026 (advance)', '2026-09-15', 'bank', 'PMT-2026-0913', 'awaiting_confirmation')
) AS v(employee_id, amount, period_label, paid_on, method, reference, confirmation_status)
JOIN public.profiles p ON p.employee_id = v.employee_id
WHERE NOT EXISTS (SELECT 1 FROM public.payments)
ON CONFLICT DO NOTHING;

-- Announcements demo data
INSERT INTO public.announcements (title, body, audience, priority, is_pinned, published_at, created_by)
SELECT v.title, v.body, v.audience, v.priority, v.is_pinned, now() - (v.days_ago || ' days')::interval,
  (SELECT id FROM public.profiles WHERE employee_id = 'SET-0001')
FROM (VALUES
  ('Welcome to the new Staff & Operations portal', 'The portal now covers people, work, company operations and administration in one place. Explore the new Projects and Tasks modules.', 'everyone', 'high', true, 1),
  ('Q3 all-hands meeting', 'The Q3 all-hands will hold on Friday at 10:00 in the main hall. Attendance is required for all Head Office staff.', 'everyone', 'normal', false, 3),
  ('Payments confirmation reminder', 'Please confirm your August payment records from the Payments page before the end of the week.', 'everyone', 'urgent', true, 2),
  ('Engineering standup moved', 'The daily engineering standup moves to 08:30 starting Monday.', 'Engineering', 'normal', false, 4)
) AS v(title, body, audience, priority, is_pinned, days_ago)
WHERE NOT EXISTS (SELECT 1 FROM public.announcements);

select 'Staff & Operations schema seeded (departments, positions, projects, tasks, work reports, payments)' as status;
