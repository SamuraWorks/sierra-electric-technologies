import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { ClockControl } from '@/components/hrm/clock-control'

export const metadata = { title: 'Attendance' }

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function hoursBetween(clockIn: string | null, clockOut: string | null) {
  if (!clockIn) return null
  const end = clockOut ? new Date(clockOut).getTime() : Date.now()
  const hours = (end - new Date(clockIn).getTime()) / 3600000
  return Math.max(0, hours)
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'attendance.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()

  const selected = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10)
  const prevDate = new Date(new Date(selected + 'T00:00:00').getTime() - 86400000).toISOString().slice(0, 10)
  const nextDate = new Date(new Date(selected + 'T00:00:00').getTime() + 86400000).toISOString().slice(0, 10)

  const isPeopleOps = hasPermission(ctx, 'attendance.manage') || ctx.roleSlugs.includes('system-admin') || ctx.roleSlugs.includes('administrator')

  // Own record + team roster
  const [ownRes, rosterRes, staffRes] = await Promise.all([
    supabase.from('attendance_records').select('clock_in, clock_out, note').eq('user_id', ctx.userId).eq('date', selected).maybeSingle(),
    isPeopleOps
      ? supabase.from('attendance_records').select('id, user_id, clock_in, clock_out, note').eq('date', selected)
      : Promise.resolve({ data: [] }),
    isPeopleOps
      ? supabase.from('profiles').select('id, display_name, employee_id, position, department').neq('employee_id', null)
      : Promise.resolve({ data: [] }),
  ])

  const own = ownRes.data
  const roster = (rosterRes.data ?? []) as {
    id: string
    user_id: string
    clock_in: string | null
    clock_out: string | null
    note: string | null
  }[]
  const staff = (staffRes.data ?? []) as {
    id: string
    display_name: string | null
    employee_id: string | null
    position: string | null
    department: string | null
  }[]

  const recordByUser = new Map(roster.map((r) => [r.user_id, r]))

  // Week summary for people ops
  let weekSummary: { present: number; total: number } | null = null
  if (isPeopleOps) {
    const monday = new Date(new Date(selected + 'T00:00:00'))
    const dow = monday.getDay()
    monday.setDate(monday.getDate() - ((dow + 6) % 7))
    const { data: weekRows } = await supabase
      .from('attendance_records')
      .select('user_id')
      .gte('date', monday.toISOString().slice(0, 10))
      .lte('date', selected)
    weekSummary = {
      present: weekRows?.length ?? 0,
      total: staff.length * 5,
    }
  }

  function initials(name: string) {
    return String(name)
      .split(' ')
      .map((n: string) => n[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
          Sierra Electric Technologies — HR
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--text)]">Attendance</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Daily roll call and staff clock records.</p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClockControl
            todayClockIn={own?.clock_in ?? null}
            todayClockOut={own?.clock_out ?? null}
            todayNote={own?.note ?? null}
          />
        </div>
        {isPeopleOps && weekSummary && (
          <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
            <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
              This week
            </p>
            <p className="font-display text-3xl font-semibold text-[var(--text)]">
              {weekSummary.present}
              <span className="text-sm font-medium text-[var(--muted)]"> / {weekSummary.total} attendance </span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">staff-clockins Mon–{selected}</p>
          </div>
        )}
      </div>

      {isPeopleOps && (
        <>
          {/* Day navigation */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              href={`/hrm/attendance?date=${prevDate}`}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--line-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              <ChevronLeft className="size-3.5" /> Previous day
            </Link>
            <p className="text-sm font-bold text-[var(--text)]">
              {new Date(new Date(selected + 'T00:00:00')).toLocaleDateString([], {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <Link
              href={`/hrm/attendance?date=${nextDate}`}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--line-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              Next day <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* Roster */}
          <div className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)]">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">Department</th>
                  <th className="px-5 py-3.5">Clock in</th>
                  <th className="px-5 py-3.5">Clock out</th>
                  <th className="px-5 py-3.5">Hours</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const rec = recordByUser.get(s.id)
                  const hours = rec ? hoursBetween(rec.clock_in, rec.clock_out) : null
                  const present = !!rec?.clock_in
                  return (
                    <tr key={s.id} className="border-b border-[var(--line)] last:border-0 transition-colors hover:bg-[var(--surface-2)]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-xs font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
                            {initials(String(s.display_name ?? '?'))}
                          </span>
                          <span>
                            <span className="block font-semibold text-[var(--text)]">{s.display_name}</span>
                            <span className="block font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">{s.employee_id}</span>
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 text-[var(--text-2)] md:table-cell">{s.department ?? '—'}</td>
                      <td className="px-5 py-3.5 text-[var(--text-2)]">{fmtTime(rec?.clock_in ?? null)}</td>
                      <td className="px-5 py-3.5 text-[var(--text-2)]">{fmtTime(rec?.clock_out ?? null)}</td>
                      <td className="px-5 py-3.5 text-[var(--text-2)]">
                        {present ? `${hours === null ? '—' : hours.toFixed(1)}h` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {present ? (
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                            Present
                          </span>
                        ) : (
                          <span className="rounded-full border border-red-400/50 bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="hidden max-w-[220px] px-5 py-3.5 text-xs text-[var(--muted)] md:table-cell">
                        {rec?.note ? <span className="break-words">{rec.note}</span> : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}