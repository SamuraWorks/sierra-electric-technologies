import { redirect } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { QuickForm } from '@/components/hrm/quick-form'
import { AnnouncementCard } from '@/components/hrm/announcement-card'

export const metadata = { title: 'Announcements' }

type ReactionRow = { emoji: string; count: number; includesMe: boolean }
type CommentItem = { id: string; body: string; createdAt: string; userId: string; authorName: string }

export default async function AnnouncementsPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'announcements.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const userId = ctx.userId
  const canCreate = hasPermission(ctx, 'announcements.create') || hasPermission(ctx, 'announcements.manage')
  const canModerate = hasPermission(ctx, 'announcements.manage')

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

  const ids = announcements.map((a) => a.id)
  let reactionRows: Array<{ announcement_id: string; user_id: string; emoji: string }> = []
  let commentRows: Array<Record<string, unknown>> = []

  if (ids.length > 0) {
    const [reactions, comments] = await Promise.all([
      supabase.from('announcement_reactions').select('announcement_id, user_id, emoji'),
      supabase.from('announcement_comments').select('id, announcement_id, user_id, body, created_at, author:user_id(display_name)').order('created_at', { ascending: true }),
    ])
    reactionRows = (reactions.data ?? []) as Array<{ announcement_id: string; user_id: string; emoji: string }>
    commentRows = (comments.data ?? []) as Array<Record<string, unknown>>
  }

  function reactionsFor(announcementId: string): ReactionRow[] {
    const byEmoji = new Map<string, { emoji: string; count: number; includesMe: boolean }>()
    for (const r of reactionRows) {
      if (r.announcement_id !== announcementId) continue
      const row = byEmoji.get(r.emoji) ?? { emoji: r.emoji, count: 0, includesMe: false }
      row.count += 1
      if (r.user_id === userId) row.includesMe = true
      byEmoji.set(r.emoji, row)
    }
    return Array.from(byEmoji.values())
  }

  function commentsFor(announcementId: string): CommentItem[] {
    return commentRows
      .filter((c) => String(c.announcement_id) === announcementId)
      .map((c) => {
        const author = Array.isArray(c.author) ? c.author[0] : c.author
        return {
          id: String(c.id),
          body: String(c.body ?? ''),
          createdAt: c.created_at ? String(c.created_at) : new Date().toISOString(),
          userId: String(c.user_id ?? ''),
          authorName: author ? String((author as Record<string, unknown>).display_name ?? '') : 'Staff',
        }
      })
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <Megaphone size={13} /> Sierra Electric — Company
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Announcements</h1>
        <p className="mt-2 text-sm text-slate-500">Internal announcements for staff. React and comment below each one.</p>
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
          <AnnouncementCard
            key={a.id}
            id={a.id}
            title={a.title}
            body={a.body}
            audience={a.audience}
            priority={a.priority}
            isPinned={a.isPinned}
            publishedAt={a.publishedAt}
            authorName={a.authorName}
            reactions={reactionsFor(a.id)}
            comments={commentsFor(a.id)}
            canModerate={canModerate}
            currentUserId={userId}
          />
        ))}
      </div>
    </div>
  )
}