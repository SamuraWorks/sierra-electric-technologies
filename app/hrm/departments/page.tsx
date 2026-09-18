import { redirect } from 'next/navigation'
import { Building2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { QuickForm } from '@/components/hrm/quick-form'

export const metadata = { title: 'Departments' }

export default async function DepartmentsPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'departments.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const canManage = hasPermission(ctx, 'departments.manage')

  const [{ data: deptRows }, { data: profileRows }] = await Promise.all([
    supabase.from('departments').select('id,name,description,is_active,head:head_id(id,display_name)').order('name'),
    supabase.from('profiles').select('id,display_name,department').neq('employee_id', null).order('display_name'),
  ])

  const staff = ((profileRows ?? []) as Record<string, unknown>[]).map((s) => ({
    id: String(s.id),
    name: String(s.display_name ?? ''),
    department: s.department ? String(s.department) : null,
  }))

  const counts = new Map<string, number>()
  for (const s of staff) {
    if (s.department) counts.set(s.department, (counts.get(s.department) ?? 0) + 1)
  }

  const departments = ((deptRows ?? []) as Record<string, unknown>[]).map((d) => {
    const head = Array.isArray(d.head) ? d.head[0] : d.head
    const headName = head ? String((head as Record<string, unknown>).display_name ?? '') : null
    return {
      id: String(d.id),
      name: String(d.name),
      description: d.description ? String(d.description) : null,
      isActive: d.is_active !== false,
      headName: headName || null,
      staffCount: counts.get(String(d.name)) ?? 0,
    }
  })

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <Building2 size={13} /> Sierra Electric — People
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Departments</h1>
        <p className="mt-2 text-sm text-slate-500">
          Organizational units of Sierra Electric, their heads and staff counts.
        </p>
      </div>

      {canManage && (
        <QuickForm
          endpoint="/api/hrm/records/departments"
          title="New department"
          submitLabel="Create department"
          fields={[
            { name: 'name', label: 'Department name', required: true, placeholder: 'e.g. Engineering' },
            {
              name: 'head_id',
              label: 'Head / responsible person',
              type: 'select',
              options: staff.map((s) => ({ value: s.id, label: s.name })),
            },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
          ]}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
            No departments yet.
          </p>
        )}
        {departments.map((d) => (
          <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-900">{d.name}</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Head: {d.headName ?? 'Unassigned'}
                </p>
              </div>
              <span
                className={
                  d.isActive
                    ? 'flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700'
                    : 'flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500'
                }
              >
                {d.isActive ? 'Active' : 'Archived'}
              </span>
            </div>
            {d.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{d.description}</p>}
            <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-600">
              <Users size={14} className="text-slate-400" />
              {d.staffCount} {d.staffCount === 1 ? 'staff member' : 'staff members'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}