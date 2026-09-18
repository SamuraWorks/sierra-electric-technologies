import { NextRequest, NextResponse } from 'next/server'
import { jsonError, requirePermission, logAuditAction } from '@/lib/api'

export async function POST(request: NextRequest) {
  const result = await requirePermission('leave.approve')
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const form = await request.formData()
  const requestId = String(form.get('request_id') ?? '')
  const decision = String(form.get('decision') ?? '')
  const note = String(form.get('note') ?? '')

  if (!requestId) return jsonError('Request ID is required')
  if (!['approved', 'rejected'].includes(decision)) return jsonError('Invalid decision')

  const { data: req } = await supabase
    .from('leave_requests')
    .select('id, start_date, end_date, status')
    .eq('id', requestId)
    .single()

  if (!req) return jsonError('Leave request not found', 404)
  if (req.status !== 'pending') return jsonError('Request is no longer pending', 409)

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: decision,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
    })
    .eq('id', requestId)

  if (error) return jsonError(error.message, 500)

  await logAuditAction(supabase, `leave.${decision}`, 'leave_request', requestId, {
    status: 'pending',
  }, { status: decision })

  return NextResponse.redirect(new URL('/hrm/leave', request.url), 303)
}