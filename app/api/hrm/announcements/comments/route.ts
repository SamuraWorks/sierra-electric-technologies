import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'

export async function POST(request: NextRequest) {
  const result = await requirePermission('announcements.view')
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const body = await request.json().catch(() => ({}))
  const announcementId = String(body.announcement_id ?? '').trim()
  const text = String(body.body ?? '').trim().slice(0, 1000)

  if (!announcementId) return jsonError('announcement_id is required')
  if (!text) return jsonError('Comment is required')

  const { data, error } = await supabase
    .from('announcement_comments')
    .insert({ announcement_id: announcementId, user_id: ctx.userId, body: text })
    .select('id')
    .single()

  if (error) {
    if (String(error.code) === '23503' && /announcements/i.test(error.message)) {
      return jsonError('Announcement not found', 404)
    }
    return jsonError(error.message, 500)
  }

  await logAuditAction(supabase, 'announcement.comment', 'announcement_comment', data.id)
  return jsonOk({ success: true, id: data.id }, 201)
}