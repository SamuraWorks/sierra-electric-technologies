import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'

export const metadata = { title: 'Employees' }

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string }>
}) {
  const { q, department } = await searchParams
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'employees.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()

  const searchTerm = (q ?? '').trim()
  const dept = (department ?? '').trim()

  let query = supabase
    .from('profiles')
    .select('id, display_name, email, employee_id, position, department, phone')
    .neq('employee_id', null)
    .order('employee_id', { ascending: true })

  if (dept) query = query.eq('department', dept)

  if (searchTerm) {
    query = query.or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`)
  }

  const [staffRes, deptsRes] = await Promise.all([
    query,
    supabase.from('profiles').select('department').not('department', 'is', null),
  ])

  const staff = staffRes.data ?? []
  const departments = Array.from(new Set((deptsRes.data ?? []).map((d) => d.department).filter(Boolean))) as string[]
  departments.sort()

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Sierra Electric Technologies — HR
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text)]">Employees</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{staff.length} staff records</p>
        </div>
        {hasPermission(ctx, 'employees.manage') && (
          <Link
            href="/hrm/employees/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)] shadow-sm transition-colors hover:bg-[var(--accent-hover)]"
          >
            <UserPlus className="size-4" />
            Add employee
          </Link>
        )}
      </div>

      {/* Filters */}
      <form method="get" action="/hrm/employees" className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            name="q"
            defaultValue={searchTerm}
            placeholder="Search name, email, role, ID…"
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <select
          name="department"
          defaultValue={dept}
          className="rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-2)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-[var(--line-2)] px-4 py-2 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          Filter
        </button>
        {(searchTerm || dept) && (
          <Link href="/hrm/employees" className="text-sm font-medium text-[var(--accent)]">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)]">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              <th className="px-5 py-3.5">Employee</th>
              <th className="hidden px-5 py-3.5 sm:table-cell">Position</th>
              <th className="hidden px-5 py-3.5 md:table-cell">Department</th>
              <th className="hidden px-5 py-3.5 lg:table-cell">Email</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr
                key={s.id}
                className="border-b border-[var(--line)] last:border-0 transition-colors hover:bg-[var(--surface-2)]"
              >
                <td className="px-5 py-3.5">
                  <Link href={`/hrm/employees/${s.id}`} className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-xs font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
                      {String(s.display_name ?? '?')
                        .split(' ')
                        .map((n: string) => n[0])
                        .filter(Boolean)
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-semibold text-[var(--text)]">{s.display_name}</span>
                      <span className="block font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
                        {s.employee_id}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="hidden px-5 py-3.5 text-[var(--text-2)] sm:table-cell">{s.position ?? '—'}</td>
                <td className="hidden px-5 py-3.5 md:table-cell">
                  <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-medium text-[var(--text-2)]">
                    {s.department ?? '—'}
                  </span>
                </td>
                <td className="hidden px-5 py-3.5 text-[var(--muted)] lg:table-cell">{s.email ?? '—'}</td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-sm text-[var(--muted)]">
                  No staff found matching your filters.{' '}
                  <Link href="/hrm/employees" className="font-medium text-[var(--accent)]">
                    Clear filters
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}