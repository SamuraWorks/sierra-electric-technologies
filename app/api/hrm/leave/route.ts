import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requireAuth, logAuditAction } from '@/lib/api'

export async function POST(request: NextRequest) {
  const result = await requireAuth()
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const body = await request.json()

  const leave_type_id = String(body.leave_type_id ?? '')
  const start_date = String(body.start_date ?? '')
  const end_date = String(body.end_date ?? '')
  const reason = String(body.reason ?? '').trim()

  if (!leave_type_id || !start_date || !end_date) {
    return jsonError('Leave type, start date and end date are required')
  }

  if (new Date(end_date) < new Date(start_date)) {
    return jsonError('End date must be on or after the start date')
  }

  const { data: leaveType } = await supabase.from('leave_types').select('id').eq('id', leave_type_id).single()
  if (!leaveType) return jsonError('Invalid leave type', 400)

  const { data: conflicting } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('status', 'pending')
    .lte('start_date', end_date)
    .gte('end_date', start_date)
    .maybeSingle()

  if (conflicting) {
    return jsonError('You already have a pending request overlapping those dates', 409)
  }

  const { data: created, error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: ctx.userId,
      leave_type_id,
      start_date,
      end_date,
      reason: reason || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return jsonError(error.message, 500)

  await logAuditAction(supabase, 'leave.create', 'leave_request', created.id, null, {
    leave_type_id,
    start_date,
    end_date,
  })

  return jsonOk({ success: true, id: created.id }, 201)
}