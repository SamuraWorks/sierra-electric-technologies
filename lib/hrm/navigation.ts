import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  Plane,
  Wallet,
  Receipt,
  GraduationCap,
  Star,
  FileText,
  Megaphone,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Settings,
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
      { label: 'Employees', href: '/hrm/employees', permission: 'employees.view' },
      { label: 'Candidates', href: '/hrm/candidates', permission: 'candidates.view' },
      { label: 'Attendance', href: '/hrm/attendance', permission: 'attendance.view' },
      { label: 'Leave', href: '/hrm/leave', permission: 'leave.view' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payroll', href: '/hrm/payroll', permission: 'payroll.view' },
      { label: 'Expenses', href: '/hrm/finance', permission: 'finance.view' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { label: 'Training', href: '/hrm/training', permission: 'training.view' },
      { label: 'Performance', href: '/hrm/performance', permission: 'performance.view' },
      { label: 'Documents', href: '/hrm/documents', permission: 'documents.view' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', href: '/hrm/reports', permission: 'reports.view' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Roles', href: '/hrm/roles', permission: 'roles.view' },
      { label: 'Audit Log', href: '/hrm/audit', permission: 'audit.view' },
      { label: 'Settings', href: '/hrm/settings', permission: 'settings.manage' },
    ],
  },
]

const ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Announcements: Megaphone,
  Employees: Users,
  Candidates: UserPlus,
  Attendance: CalendarCheck,
  Leave: Plane,
  Payroll: Wallet,
  Expenses: Receipt,
  Training: GraduationCap,
  Performance: Star,
  Documents: FileText,
  Reports: BarChart3,
  Roles: ShieldCheck,
  'Audit Log': ScrollText,
  Settings: Settings,
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