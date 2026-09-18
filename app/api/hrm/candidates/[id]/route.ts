import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'

const STATUSES = ['new', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await requirePermission('candidates.review')
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const body = await request.json()

  const { data: existing } = await supabase
    .from('candidates')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (!existing) return jsonError('Candidate not found', 404)

  const patch: Record<string, unknown> = {}

  if ('status' in body) {
    const status = String(body.status ?? '').trim()
    if (!STATUSES.includes(status)) return jsonError('Invalid status')
    patch.status = status
  }

  const textFields = ['display_name', 'phone', 'position_applied'] as const
  for (const field of textFields) {
    if (field in body) {
      const value = String(body[field] ?? '').trim()
      patch[field] = value || null
    }
  }

  if ('note' in body) {
    const note = String(body.note ?? '').trim()
    if (note) {
      const { error: noteError } = await supabase
        .from('candidate_notes')
        .insert({ candidate_id: id, user_id: ctx.userId, note })
      if (noteError) return jsonError(noteError.message, 500)
    }
  }

  if (Object.keys(patch).length === 0) return jsonError('Nothing to update')

  const { error } = await supabase.from('candidates').update(patch).eq('id', id)
  if (error) return jsonError(error.message, 500)

  await logAuditAction(supabase, 'candidate.update', 'candidate', id, { status: existing.status }, patch)

  return jsonOk({ success: true })
}