import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'

export const metadata = { title: 'Reports' }

function fmt(n: number, currency = 'SLL') {
  return `${currency === 'SLL' ? 'Le ' : ''}${n.toLocaleString([], { maximumFractionDigits: 0 })}`
}

export default async function ReportsPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'reports.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()

  const [staffRes, deptRes, attendanceRes, leaveRes, leaveTypeRes, payrollRes] = await Promise.all([
    supabase.from('profiles').select('id, department').neq('employee_id', null),
    supabase
      .from('profiles')
      .select('department')
      .not('department', 'is', null),
    supabase.from('attendance_records').select('date'),
    supabase.from('leave_requests').select('status, leave_type_id'),
    supabase.from('leave_types').select('id, name, slug'),
    supabase.from('payroll_entries').select('net_salary, currency'),
  ])

  const staffCount = staffRes.data?.length ?? 0
  const departments = (deptRes.data ?? []).reduce<Record<string, number>>((acc, d) => {
    if (d.department) acc[d.department] = (acc[d.department] ?? 0) + 1
    return acc
  }, {})

  const attendanceByDate = (attendanceRes.data ?? []).reduce<Record<string, number>>((acc, r) => {
    const d = String(r.date)
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})

  const leaveCounts = (leaveRes.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[String(r.status)] = (acc[String(r.status)] ?? 0) + 1
    return acc
  }, {})

  const leaveTypes = leaveTypeRes.data ?? []
  const leaveRequests = (leaveRes.data ?? []) as { status: string; leave_type_id: string }[]

  const approvedByType = leaveRequests
    .filter((r) => r.status === 'approved')
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.leave_type_id] = (acc[r.leave_type_id] ?? 0) + 1
      return acc
    }, {})

  const leaveByType = leaveTypes.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    approved: approvedByType[t.id] ?? 0,
  }))

  const payrollNet = payrollRes.data?.reduce((acc, e) => acc + Number(e.net_salary ?? 0), 0) ?? 0
  const payrollCurrency = Array.isArray(payrollRes.data) && payrollRes.data[0]?.currency ? String(payrollRes.data[0].currency) : 'SLL'

  const attendanceDays = Object.entries(attendanceByDate)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-7)

  // CSV for attendance
  const csvRows = [
    ['Date', 'Present', 'Absent', 'Rate %'],
    ...attendanceDays.map(([date, present]) => [
      date,
      String(present),
      String(staffCount - present),
      staffCount > 0 ? ((present / staffCount) * 100).toFixed(1) : '0',
    ]),
  ]
  const csv = csvRows.map((r) => r.join(',')).join('\n')

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Sierra Electric Technologies — Analytics
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text)]">Reports</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Live summaries across people, attendance, leave and payroll.</p>
        </div>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="sierra-attendance-week.csv"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--line-2)] px-4 py-2 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          <Download className="size-4" />
          Attendance CSV
        </a>
      </div>

      {/* KPI row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Headcount</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text)]">{staffCount}</p>
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Pending leave</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--accent)]">{leaveCounts.pending ?? 0}</p>
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Approved leave</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text)]">{leaveCounts.approved ?? 0}</p>
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Payroll this month</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text)]">{fmt(payrollNet, payrollCurrency)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Headcount by department */}
        <section className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Headcount by department</p>
          <div className="space-y-3">
            {Object.entries(departments)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, count]) => (
                <div key={dept}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--text-2)]">{dept}</span>
                    <span className="font-mono text-xs text-[var(--muted)]">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${staffCount ? Math.round((count / staffCount) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            {Object.keys(departments).length === 0 && (
              <p className="text-sm text-[var(--muted)]">No department data yet.</p>
            )}
          </div>
        </section>

        {/* Attendance last 7 days */}
        <section className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Attendance — last 7 workdays</p>
          <div className="flex h-40 items-end gap-3">
            {attendanceDays.map(([date, present]) => {
              const pct = staffCount ? Math.round((present / staffCount) * 100) : 0
              return (
                <div key={date} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[var(--muted)]">{pct}%</span>
                  <div
                    className="w-full rounded-t-md bg-[rgba(37,99,235,0.7)] transition-all"
                    style={{ height: `${Math.max(4, pct)}%` }}
                    title={`${date}: ${present}/${staffCount} present`}
                  />
                  <span className="text-[9px] uppercase tracking-wide text-[var(--muted)]">
                    {new Date(date + 'T00:00:00').toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
            {attendanceDays.length === 0 && <p className="text-sm text-[var(--muted)]">No attendance data yet.</p>}
          </div>
        </section>
      </div>

      {/* Leave by type */}
      <section className="mt-6 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Approved leave by type</p>
        <div className="flex flex-wrap gap-6">
          {leaveByType.map((t) => (
            <div key={t.slug} className="min-w-32">
              <p className="font-display text-2xl font-semibold text-[var(--accent)]">{t.approved}</p>
              <p className="text-xs text-[var(--muted)]">{t.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}