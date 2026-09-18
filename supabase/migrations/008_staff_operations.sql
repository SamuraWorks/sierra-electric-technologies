-- ============================================================
-- 008 — STAFF & OPERATIONS (Samuel's portal core)
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
  ('Administrator', 'administrator', 'Company administration and operational oversight.', 'Coordinate operations, review approvals, manage company-wide activity.', 'head-office'),
  ('System Administrator', 'system-administrator', 'Owner of the company systems and access.', 'Manage users, roles, permissions, audit log and system settings.', 'head-office'),
  ('Software Engineer', 'software-engineer', 'Builds and maintains company software and platforms.', 'Develop features, fix bugs, ship releases and support internal tools.', 'engineering'),
  ('Electrical Engineer', 'electrical-engineer', 'Electrical design and project engineering.', 'Design systems, supervise installations, ensure quality and safety.', 'engineering'),
  ('Engineering Lead', 'engineering-lead', 'Leads engineering delivery teams.', 'Own technical delivery, review designs and mentor the team.', 'engineering'),
  ('Media Officer', 'media-officer', 'Company communications and media.', 'Produce content, manage channels and support stakeholder communications.', 'head-office'),
  ('Project Engineer', 'project-engineer', 'Engineers assigned to specific projects.', 'Deliver project engineering tasks on schedule and budget.', 'engineering'),
  ('Systems Administrator', 'systems-administrator', 'Maintains IT infrastructure and systems.', 'Manage servers, networks and internal platforms.', 'engineering'),
  ('Finance Manager', 'finance-manager', 'Owns financial planning and control.', 'Oversee payments, expenses, cash flow and financial reports.', 'finance'),
  ('HR Officer', 'hr-officer', 'Supports people operations.', 'Maintain staff records, leave and payroll inputs.', 'human-resources'),
  ('Accounts Officer', 'accounts-officer', 'Processes financial transactions.', 'Record payments, reconcile accounts and support month-end.', 'finance'),
  ('Site Supervisor', 'site-supervisor', 'Supervises field work at sites.', 'Coordinate crews, enforce safety and report progress.', 'field-services'),
  ('Sales Executive', 'sales-executive', 'Sells company products and services.', 'Win new business and grow existing accounts.', 'sales'),
  ('Field Technician', 'field-technician', 'Installs and services equipment in the field.', 'Carry out installs, checks and repairs on site.', 'field-services')
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
  v.status, v.priority, v.start_date::date, v.target_date::date, v.progress
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
  v.status, v.priority, v.due_date::date,
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
SELECT p.id, pr.id, v.report_date::date, v.work_completed, v.challenges, v.next_steps
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
SELECT p.id, v.amount, v.period_label, v.paid_on::date, v.method, v.reference,
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