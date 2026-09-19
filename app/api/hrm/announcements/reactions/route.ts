import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission } from '@/lib/api'

const ALLOWED_EMOJIS = ['👍', '❤️', '🎉', '😮', '👏', '🙏']

export async function POST(request: NextRequest) {
  const result = await requirePermission('announcements.view')
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const body = await request.json().catch(() => ({}))
  const announcementId = String(body.announcement_id ?? '').trim()
  const emoji = String(body.emoji ?? '').trim()

  if (!announcementId) return jsonError('announcement_id is required')
  if (!ALLOWED_EMOJIS.includes(emoji)) return jsonError('Invalid reaction')

  const { data: existing } = await supabase
    .from('announcement_reactions')
    .select('announcement_id')
    .eq('announcement_id', announcementId)
    .eq('user_id', ctx.userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('announcement_reactions')
      .delete()
      .eq('announcement_id', announcementId)
      .eq('user_id', ctx.userId)
      .eq('emoji', emoji)
    if (error) return jsonError(error.message, 500)
    return jsonOk({ success: true, active: false })
  }

  const { error } = await supabase
    .from('announcement_reactions')
    .insert({ announcement_id: announcementId, user_id: ctx.userId, emoji })

  if (error) {
    // Concurrent duplicate → treat as removed to keep the toggle honest.
    if (String(error.code) === '23505') return jsonOk({ success: true, active: false })
    return jsonError(error.message, 500)
  }

  return jsonOk({ success: true, active: true }, 201)
}