-- ============================================================
-- 009 — THE 5 PORTAL TYPES (System Administrator, CEO, Co-Founder,
--       Administrator, Staff Member)
--
-- Transforms an existing database (which may already have the legacy
-- roles: hr-manager, manager, recruiter, finance, employee) into the
-- single-source 5-portal-type matrix. Idempotent — safe to re-run.
--
--   * Always runs: ensures the 5 roles exist, renames people-facing
--     labels, and rebuilds each of the 5 roles' permissions to match
--     lib/hrm/permissions.ts exactly.
--   * Runs once (only when legacy roles still exist): re-seats existing
--     assignments onto the new portal types, updates demo display
--     names, deletes the legacy roles, and clears the demo job
--     positions (positions will be provided and assigned later).
-- ============================================================

-- ------------------------------------------------------------------
-- 1) ENSURE THE 5 ROLES EXIST
-- ------------------------------------------------------------------
INSERT INTO public.roles (name, slug, description, hierarchy_level, is_administrative) VALUES
  ('CEO', 'ceo', 'Chief Executive Officer — full company visibility and decision-making', 2, true),
  ('Co-Founder', 'co-founder', 'Co-Founder — full company visibility and decision-making', 3, true),
  ('Administrator', 'administrator', 'Runs HR, operations, finance and company modules (business access, no system keys)', 4, true)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.roles
SET hierarchy_level = 1, is_administrative = true
WHERE slug = 'system-admin';

UPDATE public.roles
SET name = 'Staff Member', hierarchy_level = 99, is_administrative = false
WHERE slug = 'employee' AND name <> 'Staff Member';

UPDATE public.roles
SET is_administrative = true
WHERE slug IN ('ceo', 'co-founder', 'administrator');

-- ------------------------------------------------------------------
-- 2) REBUILD PERMISSION GRANTS FOR THE 5 ROLES (exact parity)
-- ------------------------------------------------------------------
DELETE FROM public.role_permissions
WHERE role_id IN (SELECT id FROM public.roles WHERE slug IN ('system-admin', 'ceo', 'co-founder', 'administrator', 'employee'));

-- System Admin / CEO / Co-Founder: ALL permissions
DO $$
DECLARE
  perm text;
BEGIN
  FOREACH perm IN ARRAY ARRAY[
    'employees.view', 'employees.manage',
    'roles.view', 'roles.assign', 'roles.remove',
    'candidates.view', 'candidates.review', 'candidates.shortlist', 'candidates.interview', 'candidates.decide',
    'attendance.view', 'attendance.manage',
    'leave.view', 'leave.manage', 'leave.approve',
    'payroll.view', 'payroll.run',
    'finance.view', 'finance.expenses.create', 'finance.expenses.approve', 'finance.reports.view',
    'training.view', 'training.manage',
    'performance.view', 'performance.manage',
    'documents.view', 'documents.manage',
    'announcements.view', 'announcements.create', 'announcements.manage',
    'departments.view', 'departments.manage',
    'positions.view', 'positions.manage',
    'projects.view', 'projects.manage',
    'tasks.view', 'tasks.manage',
    'work_reports.view', 'work_reports.manage',
    'payments.view', 'payments.manage',
    'users.manage',
    'reports.view',
    'revenue.view',
    'partners.view',
    'audit.view',
    'settings.manage'
  ]::text[]
  LOOP
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT r.id, perm FROM public.roles r
    WHERE r.slug IN ('system-admin', 'ceo', 'co-founder')
    ON CONFLICT (role_id, permission) DO NOTHING;
  END LOOP;
END $$;

-- Administrator: the same business access, minus system-only keys
INSERT INTO public.role_permissions (role_id, permission)
SELECT DISTINCT a.id, rp.permission
FROM public.role_permissions rp
JOIN public.roles src ON rp.role_id = src.id
CROSS JOIN public.roles a
WHERE src.slug = 'system-admin'
  AND a.slug = 'administrator'
  AND rp.permission NOT IN ('roles.view', 'roles.assign', 'roles.remove', 'users.manage', 'audit.view', 'settings.manage')
ON CONFLICT (role_id, permission) DO NOTHING;

-- Staff Member: self-service
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm FROM public.roles r, (VALUES
  ('attendance.view'),
  ('leave.view'),
  ('performance.view'),
  ('documents.view'),
  ('announcements.view'),
  ('payments.view'),
  ('tasks.view'),
  ('work_reports.view')
) AS p(perm) WHERE r.slug = 'employee'
ON CONFLICT (role_id, permission) DO NOTHING;

-- ------------------------------------------------------------------
-- 3) ONE-TIME TRANSFORM (legacy schemas only)
--    Re-seat assignments, refresh demo profiles, remove legacy roles,
--    and clear the demo job positions for later assignment.
-- ------------------------------------------------------------------
DO $$
DECLARE
  m     record;
  v_old uuid;
  v_new uuid;
BEGIN
  -- Legacy schemas only (the old roles were never created on fresh installs)
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'hr-manager') THEN
    RETURN;
  END IF;

  -- Move active assignments from the legacy roles on to the new portal types
  FOR m IN SELECT * FROM (VALUES
    ('hr-manager', 'administrator'),
    ('manager', 'co-founder'),
    ('recruiter', 'ceo'),
    ('finance', 'employee')
  ) AS x(old_slug, new_slug)
  LOOP
    SELECT id INTO v_old FROM public.roles WHERE slug = m.old_slug AND is_active = true;
    SELECT id INTO v_new FROM public.roles WHERE slug = m.new_slug;
    CONTINUE WHEN v_old IS NULL OR v_new IS NULL;

    UPDATE public.user_roles
    SET role_id = v_new, updated_at = now()
    WHERE role_id = v_old
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles dup
        WHERE dup.user_id = public.user_roles.user_id AND dup.role_id = v_new
      );
  END LOOP;

  -- Refresh the demo accounts' portal display names
  UPDATE public.profiles p
  SET display_name = d.display_name
  FROM (VALUES
    ('hr@syscendhrm.test', 'Administrator Demo'),
    ('manager@syscendhrm.test', 'Co-Founder Demo'),
    ('recruiter@syscendhrm.test', 'CEO Demo'),
    ('finance@syscendhrm.test', 'Staff Member Demo'),
    ('employee@syscendhrm.test', 'Staff Member Demo')
  ) AS d(email, display_name)
  WHERE p.email = d.email;

  -- Remove the legacy portal types (their assignments were moved above)
  DELETE FROM public.roles
  WHERE slug IN ('hr-manager', 'manager', 'recruiter', 'finance');

  -- Clear the demo job positions — positions & responsibilities will be
  -- provided later and assigned to these portal types (no new types needed)
  DELETE FROM public.profile_positions;
  DELETE FROM public.positions;
  UPDATE public.profiles SET position = NULL;
END $$;

select 'Portal types migrated: System Administrator, CEO, Co-Founder, Administrator, Staff Member.' as status;