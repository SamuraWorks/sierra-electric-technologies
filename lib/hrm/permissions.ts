// ============================================================
// Sierra Electric Technologies HRM — Roles & Permissions
// ============================================================

// --- Role slugs ---
export const ROLE_SLUGS = {
  SYSTEM_ADMIN: 'system-admin',
  HR_MANAGER: 'hr-manager',
  MANAGER: 'manager',
  RECRUITER: 'recruiter',
  FINANCE: 'finance',
  EMPLOYEE: 'employee',
} as const

export type RoleSlug = (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS]

// --- Employee statuses ---
export const EMPLOYEE_STATUSES = [
  'applicant',
  'probation',
  'active',
  'on_leave',
  'inactive',
  'suspended',
  'former_employee',
] as const

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

// --- Candidate/application statuses ---
export const CANDIDATE_STATUSES = [
  'draft',
  'submitted',
  'reviewing',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'selected',
  'waitlisted',
  'declined',
  'accepted',
] as const

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number]

// --- Leave types ---
export const LEAVE_TYPES = [
  'annual',
  'sick',
  'maternity',
  'paternity',
  'bereavement',
  'study',
  'unpaid',
  'other',
] as const

export type LeaveType = (typeof LEAVE_TYPES)[number]

// --- Leave request statuses ---
export const LEAVE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
] as const

export type LeaveStatus = (typeof LEAVE_STATUSES)[number]

// --- Payroll statuses ---
export const PAYROLL_STATUSES = [
  'draft',
  'processing',
  'approved',
  'paid',
  'cancelled',
] as const

export type PayrollStatus = (typeof PAYROLL_STATUSES)[number]

// --- Expense types ---
export const EXPENSE_TYPES = [
  'office',
  'travel',
  'equipment',
  'utility',
  'training',
  'salary',
  'other',
] as const

export type ExpenseType = (typeof EXPENSE_TYPES)[number]

// --- Expense statuses ---
export const EXPENSE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'paid',
] as const

export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]

// --- Audit actions ---
export const AUDIT_ACTIONS = [
  'role_changed',
  'employee_status_changed',
  'employee_created',
  'employee_deactivated',
  'application_decision',
  'announcement_published',
  'expense_approved',
  'leave_approved',
  'payroll_run',
  'permission_changed',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

// --- Organization constants ---
export const ORGANIZATION = 'Sierra Electric Technologies Ltd'
export const ORGANIZATION_USER = 'Sierra Electric Technologies — Sierra Leone'

export const HR_OFFICE = {
  name: 'Sierra Electric Technologies HR',
  email: 'hr@sierraelectric.sl',
  phone: '+232 80 247 163',
  label: 'HR Office',
} as const

// --- Designated admin (system administrator) ---
export const SYSTEM_ADMIN_EMAIL = 'samuel540wisesamura@gmail.com'
export const SYSTEM_ADMIN_INITIAL_PASSWORD = 'SamuraT3mp-2026!'

// ============================================================
// ROLE → PERMISSION MATRIX
// ============================================================
//
//   permission               | Admin | HR Mgr | Mgr | Recruiter | Finance | Employee
//   -------------------------|-------|--------|-----|-----------|---------|---------
//   employees.view           |   ✅  |    ✅  |  ✅ |    ✅     |    ✅   |   —
//   employees.manage         |   ✅  |    ✅  |  —  |    —      |    —    |   —
//   roles.view               |   ✅  |    —   |  —  |    —      |    —    |   —
//   roles.assign             |   ✅  |    —   |  —  |    —      |    —    |   —
//   roles.remove             |   ✅  |    —   |  —  |    —      |    —    |   —
//   candidates.view          |   ✅  |    ✅  |  —  |    ✅     |    —    |   —
//   candidates.review        |   ✅  |    ✅  |  —  |    ✅     |    —    |   —
//   candidates.shortlist     |   ✅  |    ✅  |  —  |    ✅     |    —    |   —
//   candidates.interview     |   ✅  |    ✅  |  —  |    ✅     |    —    |   —
//   candidates.decide        |   ✅  |    ✅  |  —  |    ✅     |    —    |   —
//   attendance.view          |   ✅  |    ✅  |  ✅ |    —      |    —    |   ✅
//   attendance.manage        |   ✅  |    ✅  |  ✅ |    —      |    —    |   —
//   leave.view               |   ✅  |    ✅  |  ✅ |    —      |    —    |   ✅
//   leave.manage             |   ✅  |    ✅  |  —  |    —      |    —    |   —
//   leave.approve            |   ✅  |    ✅  |  ✅ |    —      |    —    |   —
//   payroll.view             |   ✅  |    ✅  |  —  |    —      |    ✅   |   —
//   payroll.run              |   ✅  |    —   |  —  |    —      |    ✅   |   —
//   finance.view             |   ✅  |    ✅  |  —  |    —      |    ✅   |   —
//   finance.expenses.create  |   ✅  |    —   |  —  |    —      |    ✅   |   —
//   finance.expenses.approve |   ✅  |    —   |  —  |    —      |    ✅   |   —
//   finance.reports.view     |   ✅  |    —   |  —  |    —      |    ✅   |   —
//   training.view            |   ✅  |    ✅  |  —  |    —      |    —    |   —
//   training.manage          |   ✅  |    ✅  |  —  |    —      |    —    |   —
//   performance.view         |   ✅  |    ✅  |  ✅ |    —      |    —    |   ✅
//   performance.manage       |   ✅  |    ✅  |  —  |    —      |    —    |   —
//   documents.view           |   ✅  |    ✅  |  —  |    —      |    ✅   |   ✅
//   documents.manage         |   ✅  |    ✅  |  —  |    —      |    —    |   —
//   announcements.view       |   ✅  |    ✅  |  ✅ |    ✅     |    ✅   |   ✅
//   announcements.create     |   ✅  |    ✅  |  —  |    —      |    —    |   —
//   announcements.manage     |   ✅  |    ✅  |  ✅ |    —      |    —    |   —
//   departments.view/manage  |   ✅  |  view  |  —  |    —      |    —    |   —
//   positions.view/manage    |   ✅  |  view  |  —  |    —      |    —    |   —
//   projects.view/manage     |   ✅  |  view  | view |   —      |    —    |   —
//   tasks.view/manage        |   ✅  |  view  | view |   —      |    —    |   —
//   work_reports.view/manage |   ✅  |  view  | view |   —      |    —    |   —
//   payments.view/manage     |   ✅  |  view  | view |   —      |  view   | view
//   users.manage             |   ✅  |    —   |  —  |    —      |    —    |   —
//   reports.view             |   ✅  |    ✅  |  ✅ |    —      |    ✅   |   —
//   revenue.view             |   ✅  |    —   |  —  |    —      |    ✅   |   —
//   partners.view            |   ✅  |    ✅  |  —  |    —      |    —    |   —
//   audit.view               |   ✅  |    —   |  —  |    —      |    —    |   —
//   settings.manage          |   ✅  |    —   |  —  |    —      |    —    |   —

export const ALL_PERMISSIONS = [
  'employees.view',
  'employees.manage',
  'roles.view',
  'roles.assign',
  'roles.remove',
  'candidates.view',
  'candidates.review',
  'candidates.shortlist',
  'candidates.interview',
  'candidates.decide',
  'attendance.view',
  'attendance.manage',
  'leave.view',
  'leave.manage',
  'leave.approve',
  'payroll.view',
  'payroll.run',
  'finance.view',
  'finance.expenses.create',
  'finance.expenses.approve',
  'finance.reports.view',
  'training.view',
  'training.manage',
  'performance.view',
  'performance.manage',
  'documents.view',
  'documents.manage',
  'announcements.view',
  'announcements.create',
  'announcements.manage',
  'departments.view',
  'departments.manage',
  'positions.view',
  'positions.manage',
  'projects.view',
  'projects.manage',
  'tasks.view',
  'tasks.manage',
  'work_reports.view',
  'work_reports.manage',
  'payments.view',
  'payments.manage',
  'users.manage',
  'reports.view',
  'revenue.view',
  'partners.view',
  'audit.view',
  'settings.manage',
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

// --- Single source of truth for seeding & guards ---
export const ROLE_PERMISSIONS: Record<RoleSlug, Permission[]> = {
  'system-admin': [...ALL_PERMISSIONS],
  'hr-manager': [
    'employees.view', 'employees.manage',
    'candidates.view', 'candidates.review', 'candidates.shortlist',
    'candidates.interview', 'candidates.decide',
    'attendance.view', 'attendance.manage',
    'leave.view', 'leave.manage', 'leave.approve',
    'payroll.view',
    'finance.view',
    'training.view', 'training.manage',
    'performance.view', 'performance.manage',
    'documents.view', 'documents.manage',
    'announcements.view', 'announcements.create', 'announcements.manage',
    'departments.view', 'positions.view',
    'projects.view', 'tasks.view', 'work_reports.view', 'payments.view',
    'reports.view',
    'partners.view',
  ],
  'manager': [
    'employees.view',
    'attendance.view', 'attendance.manage',
    'leave.view', 'leave.approve',
    'performance.view',
    'announcements.view', 'announcements.manage',
    'projects.view', 'tasks.view', 'work_reports.view', 'payments.view',
    'reports.view',
  ],
  'recruiter': [
    'employees.view',
    'candidates.view', 'candidates.review', 'candidates.shortlist',
    'candidates.interview', 'candidates.decide',
    'announcements.view',
  ],
  'finance': [
    'employees.view',
    'payroll.view', 'payroll.run',
    'finance.view', 'finance.expenses.create', 'finance.expenses.approve',
    'finance.reports.view',
    'revenue.view',
    'documents.view',
    'announcements.view',
    'reports.view',
  ],
  'employee': [
    'attendance.view',
    'leave.view',
    'performance.view',
    'documents.view',
    'announcements.view',
    'payments.view',
  ],
}

// ============================================================
// DEMO / SEEDED USERS (one login per role)
// Shared demo password: Demo@1234
// ============================================================
export const SEEDED_USERS: { role: RoleSlug; email: string; displayName: string; employeeId: string }[] = [
  { role: 'system-admin', email: 'samuel540wisesamura@gmail.com', displayName: 'System Administrator', employeeId: 'SET-0001' },
  { role: 'hr-manager', email: 'hr@syscendhrm.test', displayName: 'HR Manager Demo', employeeId: 'SET-0002' },
  { role: 'manager', email: 'manager@syscendhrm.test', displayName: 'Manager Demo', employeeId: 'SET-0003' },
  { role: 'recruiter', email: 'recruiter@syscendhrm.test', displayName: 'Recruiter Demo', employeeId: 'SET-0004' },
  { role: 'finance', email: 'finance@syscendhrm.test', displayName: 'Finance Demo', employeeId: 'SET-0005' },
  { role: 'employee', email: 'employee@syscendhrm.test', displayName: 'Employee Demo', employeeId: 'SET-0006' },
]