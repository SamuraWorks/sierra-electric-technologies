import { redirect } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { QuickForm } from '@/components/hrm/quick-form'

export const metadata = { title: 'Announcements' }

const PRIORITY_BADGE: Record<string, string> = {
  normal: 'bg-slate-100 text-slate-600',
  high: 'bg-blue-50 text-blue-700',
  urgent: 'bg-red-50 text-red-700',
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

export default async function AnnouncementsPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'announcements.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const canCreate = hasPermission(ctx, 'announcements.create') || hasPermission(ctx, 'announcements.manage')

  const { data: rows } = await supabase
    .from('announcements')
    .select('id,title,body,audience,priority,is_pinned,published_at,author:created_by(display_name)')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })

  const announcements = ((rows ?? []) as Record<string, unknown>[]).map((a) => {
    const author = Array.isArray(a.author) ? a.author[0] : a.author
    return {
      id: String(a.id),
      title: String(a.title),
      body: String(a.body ?? ''),
      audience: a.audience ? String(a.audience) : 'everyone',
      priority: String(a.priority ?? 'normal'),
      isPinned: a.is_pinned === true,
      publishedAt: a.published_at ? String(a.published_at) : null,
      authorName: author ? String((author as Record<string, unknown>).display_name ?? '') : 'System',
    }
  })

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <Megaphone size={13} /> Sierra Electric — Company
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Announcements</h1>
        <p className="mt-2 text-sm text-slate-500">Internal announcements for staff.</p>
      </div>

      {canCreate && (
        <QuickForm
          endpoint="/api/hrm/records/announcements"
          title="New announcement"
          submitLabel="Publish announcement"
          fields={[
            { name: 'title', label: 'Title', required: true, full: true },
            { name: 'body', label: 'Message', type: 'textarea', required: true, full: true },
            { name: 'audience', label: 'Audience', placeholder: 'e.g. everyone, Engineering' },
            {
              name: 'priority',
              label: 'Priority',
              type: 'select',
              defaultValue: 'normal',
              options: [
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ],
            },
            {
              name: 'is_pinned',
              label: 'Pin to top',
              type: 'select',
              defaultValue: 'false',
              options: [
                { value: 'false', label: 'No' },
                { value: 'true', label: 'Yes' },
              ],
            },
          ]}
        />
      )}

      <div className="space-y-4">
        {announcements.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
            No announcements yet.
          </p>
        )}
        {announcements.map((a) => (
          <div
            key={a.id}
            className={`rounded-2xl border bg-white p-5 ${a.isPinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {a.isPinned && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">
                  Pinned
                </span>
              )}
              <h2 className="font-semibold text-slate-900">{a.title}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_BADGE[a.priority] ?? PRIORITY_BADGE.normal}`}>
                {a.priority}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{a.body}</p>
            <p className="mt-4 text-xs text-slate-400">
              {a.authorName} · {a.audience} · {fmt(a.publishedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}