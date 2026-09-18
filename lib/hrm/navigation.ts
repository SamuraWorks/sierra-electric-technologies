import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  Plane,
  Wallet,
  Banknote,
  Receipt,
  GraduationCap,
  Star,
  FileText,
  Megaphone,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Settings,
  Handshake,
  Building2,
  Briefcase,
  FolderKanban,
  ListTodo,
  ClipboardList,
  UserCog,
  UserCircle,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { label: string; href: string; permission?: string; exact?: boolean }
export type NavGroup = { title: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/hrm/dashboard', exact: true },
      { label: 'Announcements', href: '/hrm/announcements', permission: 'announcements.view' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Staff', href: '/hrm/employees', permission: 'employees.view' },
      { label: 'Departments', href: '/hrm/departments', permission: 'departments.view' },
      { label: 'Positions', href: '/hrm/positions', permission: 'positions.view' },
    ],
  },
  {
    title: 'Work',
    items: [
      { label: 'Projects', href: '/hrm/projects', permission: 'projects.view' },
      { label: 'Tasks', href: '/hrm/tasks', permission: 'tasks.view' },
      { label: 'Work Reports', href: '/hrm/work-reports', permission: 'work_reports.view' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'Attendance', href: '/hrm/attendance', permission: 'attendance.view' },
      { label: 'Leave', href: '/hrm/leave', permission: 'leave.view' },
      { label: 'Payments', href: '/hrm/payments', permission: 'payments.view' },
      { label: 'Expenses', href: '/hrm/expenses', permission: 'finance.view' },
      { label: 'Documents', href: '/hrm/documents', permission: 'documents.view' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { label: 'Training', href: '/hrm/training', permission: 'training.view' },
      { label: 'Performance', href: '/hrm/performance', permission: 'performance.view' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', href: '/hrm/reports', permission: 'reports.view' },
      { label: 'Partner Gigs', href: '/hrm/partners', permission: 'partners.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: '/hrm/users', permission: 'users.manage' },
      { label: 'Roles & Permissions', href: '/hrm/roles', permission: 'roles.view' },
      { label: 'Audit Log', href: '/hrm/audit', permission: 'audit.view' },
      { label: 'Settings', href: '/hrm/settings', permission: 'settings.manage' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'My Profile', href: '/hrm/profile' },
    ],
  },
]

const ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Announcements: Megaphone,
  Staff: Users,
  Departments: Building2,
  Positions: Briefcase,
  Projects: FolderKanban,
  Tasks: ListTodo,
  'Work Reports': ClipboardList,
  Attendance: CalendarCheck,
  Leave: Plane,
  Payments: Banknote,
  Expenses: Receipt,
  Documents: FileText,
  Training: GraduationCap,
  Performance: Star,
  Reports: BarChart3,
  'Partner Gigs': Handshake,
  Users: UserCog,
  'Roles & Permissions': ShieldCheck,
  'Audit Log': ScrollText,
  Settings: Settings,
  'My Profile': UserCircle,
  // Legacy / secondary labels
  Employees: Users,
  Candidates: UserPlus,
  Payroll: Wallet,
  Roles: ShieldCheck,
}

export function getIcon(label: string): LucideIcon {
  return ICONS[label] ?? LayoutDashboard
}

export function filterNavGroups(permissions: string[]): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || permissions.includes(item.permission),
    ),
  })).filter((group) => group.items.length > 0)
}

export function isActive(href: string, pathname: string, exact = false): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}
