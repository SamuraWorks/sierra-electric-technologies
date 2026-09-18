import { redirect } from 'next/navigation'
import { FolderKanban, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { QuickForm } from '@/components/hrm/quick-form'

export const metadata = { title: 'Projects' }

const STATUS_BADGE: Record<string, string> = {
  planning: 'bg-slate-100 text-slate-600',
  active: 'bg-blue-50 text-blue-700',
  on_hold: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-indigo-50 text-indigo-700',
  high: 'bg-red-50 text-red-700',
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null

export default async function ProjectsPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'projects.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const canManage = hasPermission(ctx, 'projects.manage')

  const [{ data: projectRows }, { data: profileRows }, { data: deptRows }] = await Promise.all([
    supabase
      .from('projects')
      .select('id,name,description,status,priority,start_date,target_date,progress,lead:lead_id(display_name),department:department_id(name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id,display_name').neq('employee_id', null).order('display_name'),
    supabase.from('departments').select('id,name').order('name'),
  ])

  const projects = ((projectRows ?? []) as Record<string, unknown>[]).map((p) => {
    const lead = Array.isArray(p.lead) ? p.lead[0] : p.lead
    const dept = Array.isArray(p.department) ? p.department[0] : p.department
    return {
      id: String(p.id),
      name: String(p.name),
      description: p.description ? String(p.description) : null,
      status: String(p.status ?? 'planning'),
      priority: String(p.priority ?? 'medium'),
      startDate: p.start_date ? String(p.start_date) : null,
      targetDate: p.target_date ? String(p.target_date) : null,
      progress: Number(p.progress) || 0,
      leadName: lead ? String((lead as Record<string, unknown>).display_name ?? '') : null,
      departmentName: dept ? String((dept as Record<string, unknown>).name ?? '') : null,
    }
  })

  const staffOptions = ((profileRows ?? []) as Record<string, unknown>[]).map((s) => ({
    value: String(s.id),
    label: String(s.display_name ?? ''),
  }))
  const deptOptions = ((deptRows ?? []) as Record<string, unknown>[]).map((d) => ({
    value: String(d.id),
    label: String(d.name),
  }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <FolderKanban size={13} /> Sierra Electric — Work
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-2 text-sm text-slate-500">
          Company projects, leads, teams and delivery progress.
        </p>
      </div>

      {canManage && (
        <QuickForm
          endpoint="/api/hrm/records/projects"
          title="New project"
          submitLabel="Create project"
          fields={[
            { name: 'name', label: 'Project name', required: true, full: true },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
            { name: 'lead_id', label: 'Project lead', type: 'select', options: staffOptions },
            { name: 'department_id', label: 'Department', type: 'select', options: deptOptions },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              defaultValue: 'planning',
              options: [
                { value: 'planning', label: 'Planning' },
                { value: 'active', label: 'Active' },
                { value: 'on_hold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' },
              ],
            },
            {
              name: 'priority',
              label: 'Priority',
              type: 'select',
              defaultValue: 'medium',
              options: [
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ],
            },
            { name: 'start_date', label: 'Start date', type: 'date' },
            { name: 'target_date', label: 'Target date', type: 'date' },
            { name: 'progress', label: 'Progress (%)', type: 'number' },
          ]}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
            No projects yet.
          </p>
        )}
        {projects.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 truncate font-semibold text-slate-900">{p.name}</h2>
              <span className={`flex-shrink-0 capitalize rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status] ?? STATUS_BADGE.planning}`}>
                {p.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className={`capitalize rounded-full px-2 py-0.5 font-medium ${PRIORITY_BADGE[p.priority] ?? PRIORITY_BADGE.medium}`}>
                {p.priority}
              </span>
              <span>{p.departmentName ?? '—'}</span>
              <span>· Lead: {p.leadName ?? 'Unassigned'}</span>
            </div>
            {p.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{p.description}</p>}

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span className="font-semibold text-slate-700">{p.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <CalendarDays size={13} />
              {fmtDate(p.startDate) ?? 'No start'} → {fmtDate(p.targetDate) ?? 'No target'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}