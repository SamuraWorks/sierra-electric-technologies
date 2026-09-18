import { redirect } from 'next/navigation'
import { ListChecks } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { QuickForm } from '@/components/hrm/quick-form'

export const metadata = { title: 'Tasks' }

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'review', label: 'Review' },
  { key: 'completed', label: 'Completed' },
]

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-300',
  medium: 'bg-indigo-400',
  high: 'bg-red-500',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-indigo-50 text-indigo-700',
  high: 'bg-red-50 text-red-700',
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null

export default async function TasksPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'tasks.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const canManage = hasPermission(ctx, 'tasks.manage')

  const [{ data: taskRows }, { data: projectRows }, { data: profileRows }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id,title,description,status,priority,due_date,assignee:assignee_id(display_name),project:project_id(name)')
      .order('created_at', { ascending: false }),
    supabase.from('projects').select('id,name').order('name'),
    supabase.from('profiles').select('id,display_name').neq('employee_id', null).order('display_name'),
  ])

  const tasks = ((taskRows ?? []) as Record<string, unknown>[]).map((t) => {
    const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee
    const project = Array.isArray(t.project) ? t.project[0] : t.project
    return {
      id: String(t.id),
      title: String(t.title),
      description: t.description ? String(t.description) : null,
      status: String(t.status ?? 'todo'),
      priority: String(t.priority ?? 'medium'),
      dueDate: t.due_date ? String(t.due_date) : null,
      assigneeName: assignee ? String((assignee as Record<string, unknown>).display_name ?? '') : null,
      projectName: project ? String((project as Record<string, unknown>).name ?? '') : null,
    }
  })

  const projectOptions = ((projectRows ?? []) as Record<string, unknown>[]).map((p) => ({
    value: String(p.id),
    label: String(p.name),
  }))
  const staffOptions = ((profileRows ?? []) as Record<string, unknown>[]).map((s) => ({
    value: String(s.id),
    label: String(s.display_name ?? ''),
  }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <ListChecks size={13} /> Sierra Electric — Work
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Tasks</h1>
        <p className="mt-2 text-sm text-slate-500">Day-to-day work assigned across the company.</p>
      </div>

      {canManage && (
        <QuickForm
          endpoint="/api/hrm/records/tasks"
          title="New task"
          submitLabel="Create task"
          fields={[
            { name: 'title', label: 'Task title', required: true, full: true },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
            { name: 'project_id', label: 'Project', type: 'select', options: projectOptions },
            { name: 'assignee_id', label: 'Assignee', type: 'select', options: staffOptions },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              defaultValue: 'todo',
              options: COLUMNS.map((c) => ({ value: c.key, label: c.label })),
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
            { name: 'due_date', label: 'Due date', type: 'date' },
          ]}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{col.label}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-slate-400">Nothing here</p>}
                {items.map((t) => (
                  <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[t.priority] ?? PRIORITY_DOT.medium}`} />
                      <p className="text-sm font-medium leading-snug text-slate-900">{t.title}</p>
                    </div>
                    {t.projectName && <p className="mt-1.5 ml-4 text-[11px] text-slate-400">{t.projectName}</p>}
                    <div className="mt-3 ml-4 flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium capitalize ${PRIORITY_LABEL[t.priority] ?? PRIORITY_LABEL.medium}`}>
                        {t.priority}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {t.assigneeName ?? 'Unassigned'}
                        {t.dueDate ? ` · ${fmt(t.dueDate)}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}