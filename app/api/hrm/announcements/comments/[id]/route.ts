import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requireAuth, logAuditAction } from '@/lib/api'
import { hasPermission } from '@/lib/hrm/auth'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await requireAuth()
  if ('error' in result) return result.error

  const { supabase, ctx } = result

  const { data: comment } = await supabase
    .from('announcement_comments')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()

  if (!comment) return jsonError('Comment not found', 404)

  const isOwner = comment.user_id === ctx.userId
  const canModerate = hasPermission(ctx, 'announcements.manage')
  if (!isOwner && !canModerate) {
    return jsonError('Forbidden — insufficient permissions', 403)
  }

  const { data: deleted, error } = await supabase.from('announcement_comments').delete().eq('id', id).select('id')
  if (error) return jsonError(error.message, 500)

  await logAuditAction(supabase, isOwner ? 'announcement.comment_deleted' : 'announcement.comment_moderated', 'announcement_comment', deleted?.[0]?.id ?? id)

  return jsonOk({ success: true })
}