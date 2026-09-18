import { redirect } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { QuickForm } from '@/components/hrm/quick-form'

export const metadata = { title: 'Work Reports' }

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default async function WorkReportsPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'work_reports.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()

  const [{ data: reportRows }, { data: projectRows }] = await Promise.all([
    supabase
      .from('work_reports')
      .select('id,report_date,work_completed,challenges,next_steps,created_at,author:profile_id(display_name),project:project_id(name)')
      .order('report_date', { ascending: false }),
    supabase.from('projects').select('id,name').order('name'),
  ])

  const reports = ((reportRows ?? []) as Record<string, unknown>[]).map((r) => {
    const author = Array.isArray(r.author) ? r.author[0] : r.author
    const project = Array.isArray(r.project) ? r.project[0] : r.project
    return {
      id: String(r.id),
      date: r.report_date ? String(r.report_date) : null,
      workCompleted: String(r.work_completed ?? ''),
      challenges: r.challenges ? String(r.challenges) : null,
      nextSteps: r.next_steps ? String(r.next_steps) : null,
      authorName: author ? String((author as Record<string, unknown>).display_name ?? '') : 'Unknown',
      projectName: project ? String((project as Record<string, unknown>).name ?? '') : null,
    }
  })

  const projectOptions = ((projectRows ?? []) as Record<string, unknown>[]).map((p) => ({
    value: String(p.id),
    label: String(p.name),
  }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <ClipboardList size={13} /> Sierra Electric — Work
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Work Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Daily and periodic progress submitted by staff.</p>
      </div>

      <QuickForm
        endpoint="/api/hrm/records/work-reports"
        title="Submit a work report"
        submitLabel="Submit report"
        fields={[
          { name: 'project_id', label: 'Project', type: 'select', options: projectOptions },
          { name: 'report_date', label: 'Report date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
          { name: 'work_completed', label: 'Work completed today', type: 'textarea', required: true, full: true },
          { name: 'challenges', label: 'Challenges / blockers', type: 'textarea', full: true },
          { name: 'next_steps', label: 'Next steps', type: 'textarea', full: true },
        ]}
      />

      <div className="space-y-4">
        {reports.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
            No work reports submitted yet.
          </p>
        )}
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {r.authorName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.authorName}</p>
                  <p className="text-xs text-slate-400">
                    {r.projectName ?? 'General'} · {fmt(r.date)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Work completed</p>
                <p className="mt-1 whitespace-pre-line text-slate-700">{r.workCompleted}</p>
              </div>
              {r.challenges && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-600">Challenges</p>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{r.challenges}</p>
                </div>
              )}
              {r.nextSteps && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Next steps</p>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{r.nextSteps}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}