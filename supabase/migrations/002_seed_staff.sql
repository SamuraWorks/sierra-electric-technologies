-- ============================================================
-- Sierra Electric Technologies HRM — Seed staff roster
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
    ('admin@sierraelectric.sl', 'Chief Technology Officer', 'Head Office'),
    ('hr@syscendhrm.test', 'Head of Human Resources', 'Human Resources'),
    ('manager@syscendhrm.test', 'Operations Manager', 'Operations'),
    ('recruiter@syscendhrm.test', 'Talent Acquisition Lead', 'Human Resources'),
    ('finance@syscendhrm.test', 'Finance Manager', 'Finance'),
    ('employee@syscendhrm.test', 'Field Technician', 'Field Services')
  ) AS d(email, position, department)
  LOOP
    SELECT id INTO v_id FROM auth.users WHERE email = d.email;
    CONTINUE WHEN v_id IS NULL;
    UPDATE public.profiles
    SET position = d.position,
        department = d.department,
        phone = '232 76 123 ' || lpad(department::int % 100, 3, '0')
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