import Link from 'next/link'
import {
  ArrowRight,
  Banknote,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderKanban,
  ListTodo,
  Megaphone,
  ScrollText,
  TrendingUp,
  Users,
} from 'lucide-react'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { createClient } from '@/lib/supabase/server'
import { ClockControl } from '@/components/hrm/clock-control'

export const metadata = { title: 'Dashboard' }

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function greeting(date: Date): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const fmtLe = (n: number) => `Le ${Math.round(n).toLocaleString('en-US')}`

const fmtDay = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null

const TASK_STATUS: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-700',
  blocked: 'bg-red-50 text-red-700',
  review: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
}

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-300',
  medium: 'bg-indigo-400',
  high: 'bg-red-500',
}

export default async function DashboardPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null
  const supabase = await createClient()

  const can = (p: string) => hasPermission(ctx, p)
  const userId = ctx.userId
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  const [
    leadProjectsRes,
    teamProjectsRes,
    myTasksRes,
    taskStatusRes,
    announcementsRes,
    staffCountRes,
    deptCountRes,
    leavePendingRes,
    revenueRes,
    auditRes,
    notificationsRes,
    ownAttRes,
    teamAttRes,
    teamStaffRes,
  ] = await Promise.all([
    supabase.from('projects').select('id,name,status,priority,progress,target_date').eq('lead_id', userId),
    supabase.from('project_team').select('project:project_id(id,name,status,priority,progress,target_date)').eq('profile_id', userId),
    supabase
      .from('tasks')
      .select('id,title,status,priority,due_date,project:project_id(name)')
      .eq('assignee_id', userId)
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(6),
    supabase.from('tasks').select('status').eq('assignee_id', userId),
    supabase.from('announcements').select('id,title,priority,published_at').order('published_at', { ascending: false }).limit(4),
    can('employees.view')
      ? supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('employee_id', null)
      : Promise.resolve(null),
    can('departments.view')
      ? supabase.from('departments').select('*', { count: 'exact', head: true })
      : Promise.resolve(null),
    can('leave.view')
      ? supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve(null),
    can('revenue.view') ? supabase.from('revenue_transactions').select('amount') : Promise.resolve(null),
    can('audit.view')
      ? supabase.from('audit_logs').select('action,target_type,created_at').order('created_at', { ascending: false }).limit(8)
      : Promise.resolve(null),
    supabase.from('notifications').select('id,title,message,link,is_read,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(6),
    supabase.from('attendance_records').select('clock_in, clock_out, note').eq('user_id', userId).eq('date', today).maybeSingle(),
    can('attendance.manage')
      ? supabase.from('attendance_records').select('user_id, clock_in, clock_out').eq('date', today)
      : Promise.resolve({ data: [] }),
    can('attendance.manage')
      ? supabase.from('profiles').select('id, display_name, employee_id').neq('employee_id', null)
      : Promise.resolve({ data: [] }),
  ])

  const projectMap = new Map<string, { id: string; name: string; status: string; priority: string; progress: number; target_date: string | null }>()
  for (const p of (leadProjectsRes.data ?? []) as Record<string, unknown>[]) {
    projectMap.set(String(p.id), {
      id: String(p.id),
      name: String(p.name),
      status: String(p.status ?? 'planning'),
      priority: String(p.priority ?? 'medium'),
      progress: Number(p.progress) || 0,
      target_date: p.target_date ? String(p.target_date) : null,
    })
  }
  for (const row of (teamProjectsRes.data ?? []) as Record<string, unknown>[]) {
    const p = Array.isArray(row.project) ? row.project[0] : row.project
    if (!p) continue
    const proj = p as Record<string, unknown>
    projectMap.set(String(proj.id), {
      id: String(proj.id),
      name: String(proj.name),
      status: String(proj.status ?? 'planning'),
      priority: String(proj.priority ?? 'medium'),
      progress: Number(proj.progress) || 0,
      target_date: proj.target_date ? String(proj.target_date) : null,
    })
  }
  const myProjects = Array.from(projectMap.values())
  const activeProjects = myProjects.filter((p) => p.status === 'active' || p.status === 'planning')

  const myTasks = ((myTasksRes.data ?? []) as Record<string, unknown>[]).map((t) => {
    const project = Array.isArray(t.project) ? t.project[0] : t.project
    return {
      id: String(t.id),
      title: String(t.title),
      status: String(t.status ?? 'todo'),
      priority: String(t.priority ?? 'medium'),
      dueDate: t.due_date ? String(t.due_date) : null,
      projectName: project ? String((project as Record<string, unknown>).name ?? '') : null,
    }
  })

  const statusRows = (taskStatusRes.data ?? []) as Array<{ status: string }>
  const openTasks = statusRows.filter((t) => t.status !== 'completed').length
  const completedTasks = statusRows.filter((t) => t.status === 'completed').length
  const overdueTasks = myTasks.filter((t) => t.dueDate && t.dueDate < today).length

  const announcements = (announcementsRes.data ?? []) as Array<{ id: string; title: string; priority: string; published_at: string | null }>
  const newAnnouncements = announcements.filter(
    (a) => a.published_at && Date.now() - new Date(a.published_at).getTime() < 7 * 24 * 3600 * 1000,
  ).length

  const pendingApprovals = leavePendingRes?.count ?? 0
  const pendingActions = pendingApprovals + overdueTasks
  const staffCount = staffCountRes?.count ?? 0
  const deptCount = deptCountRes?.count ?? 0

  let totalRevenue = 0
  for (const r of (revenueRes?.data ?? []) as Array<{ amount: string | number }>) {
    totalRevenue += Number(r.amount) || 0
  }

  const firstName = String((ctx.profile as unknown as Record<string, unknown>)?.display_name ?? 'there').split(' ')[0]

  const cards = [
    { label: 'My active projects', value: String(activeProjects.length), href: '/hrm/projects', icon: FolderKanban, color: 'bg-blue-600', show: true },
    { label: 'My open tasks', value: String(openTasks), href: '/hrm/tasks', icon: ListTodo, color: 'bg-violet-600', show: true },
    { label: 'Pending approvals', value: String(pendingApprovals), href: '/hrm/leave', icon: CalendarClock, color: 'bg-amber-500', show: can('leave.view') },
    { label: 'Staff', value: String(staffCount), href: '/hrm/employees', icon: Users, color: 'bg-orange-500', show: can('employees.view') },
    { label: 'New announcements', value: String(newAnnouncements), href: '/hrm/announcements', icon: Megaphone, color: 'bg-pink-500', show: true },
    { label: 'Pending actions', value: String(pendingActions), href: '/hrm/tasks', icon: Bell, color: 'bg-red-500', show: true },
  ].filter((c) => c.show)

  const quickActions = [
    { label: 'New task', href: '/hrm/tasks', icon: ListTodo, show: can('tasks.manage') },
    { label: 'New project', href: '/hrm/projects', icon: FolderKanban, show: can('projects.manage') },
    { label: 'Submit report', href: '/hrm/work-reports', icon: ClipboardList, show: can('work_reports.view') },
    { label: 'Announcement', href: '/hrm/announcements', icon: Megaphone, show: can('announcements.create') || can('announcements.manage') },
    { label: 'Payments', href: '/hrm/payments', icon: Banknote, show: can('payments.view') },
    { label: 'Staff', href: '/hrm/employees', icon: Users, show: can('employees.view') },
  ].filter((a) => a.show)

  const audit = ((auditRes?.data ?? []) as Record<string, unknown>[]).map((a) => ({
    action: String(a.action ?? ''),
    targetType: String(a.target_type ?? ''),
    createdAt: a.created_at ? String(a.created_at) : null,
  }))
  const notifications = notificationsRes.data ?? []

  const ownAtt = ownAttRes.data as { clock_in: string | null; clock_out: string | null; note: string | null } | null

  const isPeopleOps = can('attendance.manage')
  const teamRows = (teamAttRes.data ?? []) as Array<{ user_id: string; clock_in: string | null; clock_out: string | null }>
  const teamStaff = (teamStaffRes.data ?? []) as Array<{ id: string; display_name: string | null; employee_id: string | null }>
  const teamRecordByUser = new Map(teamRows.map((r) => [r.user_id, r]))
  const inNow = teamRows.filter((r) => r.clock_in && !r.clock_out).length
  const signedOut = teamRows.filter((r) => r.clock_out).length
  const notIn = teamStaff.length === 0 ? 0 : teamStaff.length - teamRows.length

  const snapshot = [
    { label: 'Active staff', value: String(staffCount), icon: Users, show: can('employees.view') },
    { label: 'Departments', value: String(deptCount), icon: Building2, show: can('departments.view') },
    { label: 'Open tasks', value: String(openTasks), icon: ListTodo, show: true },
    { label: 'Completed tasks', value: String(completedTasks), icon: CheckCircle2, show: true },
    { label: 'Total revenue', value: fmtLe(totalRevenue), icon: TrendingUp, show: can('revenue.view') },
  ].filter((s) => s.show)

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-semibold text-slate-900">
          {greeting(now)}, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Here&apos;s what&apos;s happening across Sierra Electric today.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock3 size={16} className="text-blue-600" /> Attendance
            </h2>
            <Link href="/hrm/attendance" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <ClockControl compact todayClockIn={ownAtt?.clock_in ?? null} todayClockOut={ownAtt?.clock_out ?? null} todayNote={ownAtt?.note ?? null} />
        </div>

        {isPeopleOps && (
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Clock3 size={16} className="text-blue-600" /> Team today
              </h2>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="px-2 py-3 text-center">
                <p className="font-display text-xl font-semibold text-slate-900">{inNow}</p>
                <p className="text-[11px] text-slate-400">Signed in</p>
              </div>
              <div className="px-2 py-3 text-center">
                <p className="font-display text-xl font-semibold text-slate-900">{signedOut}</p>
                <p className="text-[11px] text-slate-400">Out</p>
              </div>
              <div className="px-2 py-3 text-center">
                <p className="font-display text-xl font-semibold text-slate-900">{notIn}</p>
                <p className="text-[11px] text-slate-400">Not in</p>
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {teamStaff.slice(0, 7).map((s) => {
                const rec = teamRecordByUser.get(s.id)
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${rec?.clock_in && !rec.clock_out ? 'bg-emerald-500' : rec?.clock_out ? 'bg-slate-300' : 'bg-red-400'}`}
                      />
                      <span className="truncate text-sm font-medium text-slate-800">{s.display_name ?? 'Staff'}</span>
                    </span>
                    <span className="flex-shrink-0 text-xs text-slate-400">
                      {rec?.clock_in
                        ? `${new Date(rec.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${rec.clock_out ? ' – out' : ''}`
                        : 'Not in'}
                    </span>
                  </li>
                )
              })}
            </ul>
            <Link
              href="/hrm/attendance"
              className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-blue-600 hover:text-blue-700 sm:px-6"
            >
              Open full attendance <ArrowRight size={12} />
            </Link>
          </section>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">{label}</p>
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white ${color}`}>
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-2 font-display text-3xl font-semibold text-slate-900">{value}</p>
          </Link>
        ))}
      </div>

      {quickActions.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              <Icon size={15} className="text-blue-600" /> {label}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <ListTodo size={16} className="text-blue-600" /> My work
            </h2>
            <Link href="/hrm/tasks" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
              All tasks <ArrowRight size={12} />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {myTasks.length === 0 && (
              <li className="px-6 py-12 text-center text-sm text-slate-400">No open tasks assigned to you.</li>
            )}
            {myTasks.map((t) => (
              <li key={t.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[t.priority] ?? PRIORITY_DOT.medium}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                    <p className="truncate text-xs text-slate-400">
                      {t.projectName ?? 'General'}
                      {t.dueDate ? ` · due ${fmtDay(t.dueDate)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2 sm:pl-5">
                  {t.dueDate && t.dueDate < today && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-semibold text-red-600">Overdue</span>
                  )}
                  <span className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-medium ${TASK_STATUS[t.status] ?? TASK_STATUS.todo}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <TrendingUp size={16} className="text-blue-600" /> Company snapshot
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {snapshot.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3.5 sm:px-6">
                <span className="flex items-center gap-2.5 text-sm text-slate-500">
                  <Icon size={15} className="text-slate-400" /> {label}
                </span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <ScrollText size={16} className="text-blue-600" /> Recent activity
            </h2>
          </div>
          {can('audit.view') ? (
            <ul className="divide-y divide-slate-100">
              {audit.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-400 sm:px-6">No recent activity.</li>}
              {audit.map((a, i) => (
                <li key={i} className="px-4 py-3.5 sm:px-6">
                  <p className="break-words text-sm text-slate-700">{a.action}</p>
                  <p className="mt-0.5 break-words text-xs text-slate-400">
                    {a.targetType} · {timeAgo(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-400 sm:px-6">You&apos;re all caught up.</li>}
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3.5 sm:px-6">
                  {n.link ? (
                    <Link href={n.link} className="block break-words text-sm font-medium text-slate-800">
                      {n.title}
                      {!n.is_read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-600" />}
                    </Link>
                  ) : (
                    <p className="break-words text-sm font-medium text-slate-800">
                      {n.title}
                      {!n.is_read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-600" />}
                    </p>
                  )}
                  {n.message && <p className="mt-0.5 break-words text-xs text-slate-400">{n.message}</p>}
                  <p className="mt-1 text-[11px] text-slate-300">{timeAgo(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Megaphone size={16} className="text-blue-600" /> Announcements
            </h2>
            <Link href="/hrm/announcements" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {announcements.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-slate-400 sm:px-6">No announcements yet.</li>
            )}
            {announcements.map((a) => (
              <li key={a.id} className="px-4 py-3.5 sm:px-6">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <Link
                    href="/hrm/announcements"
                    className="min-w-0 break-words text-sm font-medium text-slate-800 hover:text-blue-700"
                  >
                    {a.title}
                  </Link>
                  <span className="flex-shrink-0 text-xs text-slate-400 sm:ml-4">{timeAgo(a.published_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}