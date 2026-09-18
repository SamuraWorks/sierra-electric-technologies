import { redirect } from 'next/navigation'
import { Briefcase, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { QuickForm } from '@/components/hrm/quick-form'

export const metadata = { title: 'Positions' }

export default async function PositionsPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'positions.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const canManage = hasPermission(ctx, 'positions.manage')

  const [{ data: posRows }, { data: deptRows }, { data: linkRows }] = await Promise.all([
    supabase
      .from('positions')
      .select('id,name,description,responsibilities,department:department_id(name)')
      .order('name'),
    supabase.from('departments').select('id,name').order('name'),
    supabase.from('profile_positions').select('position_id'),
  ])

  const counts = new Map<string, number>()
  for (const l of (linkRows ?? []) as Record<string, unknown>[]) {
    const id = String(l.position_id)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  const positions = ((posRows ?? []) as Record<string, unknown>[]).map((p) => {
    const dept = Array.isArray(p.department) ? p.department[0] : p.department
    return {
      id: String(p.id),
      name: String(p.name),
      description: p.description ? String(p.description) : null,
      responsibilities: p.responsibilities ? String(p.responsibilities) : null,
      departmentName: dept ? String((dept as Record<string, unknown>).name ?? '') : null,
      staffCount: counts.get(String(p.id)) ?? 0,
    }
  })

  const departments = ((deptRows ?? []) as Record<string, unknown>[]).map((d) => ({
    value: String(d.id),
    label: String(d.name),
  }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <Briefcase size={13} /> Sierra Electric — People
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Positions</h1>
        <p className="mt-2 text-sm text-slate-500">
          What people do at Sierra Electric. Positions describe roles — they are not permissions.
        </p>
      </div>

      {canManage && (
        <QuickForm
          endpoint="/api/hrm/records/positions"
          title="New position"
          submitLabel="Create position"
          fields={[
            { name: 'name', label: 'Position name', required: true, placeholder: 'e.g. Software Engineer' },
            { name: 'department_id', label: 'Department', type: 'select', options: departments },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
            { name: 'responsibilities', label: 'Responsibilities', type: 'textarea', full: true },
          ]}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10.5px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-6 py-3.5 font-semibold">Position</th>
                <th className="hidden px-6 py-3.5 font-semibold md:table-cell">Department</th>
                <th className="hidden px-6 py-3.5 font-semibold lg:table-cell">Responsibilities</th>
                <th className="px-6 py-3.5 font-semibold">Staff</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">
                    No positions defined yet.
                  </td>
                </tr>
              )}
              {positions.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    {p.description && <p className="mt-0.5 text-xs text-slate-400">{p.description}</p>}
                  </td>
                  <td className="hidden px-6 py-4 text-slate-600 md:table-cell">{p.departmentName ?? '—'}</td>
                  <td className="hidden max-w-md px-6 py-4 text-xs text-slate-500 lg:table-cell">
                    {p.responsibilities ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      <Users size={12} /> {p.staffCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}