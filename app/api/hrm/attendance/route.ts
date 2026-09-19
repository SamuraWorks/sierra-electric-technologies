import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requireAuth, logAuditAction } from '@/lib/api'

export async function POST(request: NextRequest) {
  const result = await requireAuth()
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const body = await request.json()
  const action = String(body.action ?? '').trim()
  const note = String(body.note ?? '').trim().slice(0, 200)

  if (!['clock-in', 'clock-out'].includes(action)) {
    return jsonError('Invalid action')
  }

  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  const { data: record } = await supabase
    .from('attendance_records')
    .select('id, date, clock_in, clock_out')
    .eq('user_id', ctx.userId)
    .eq('date', today)
    .maybeSingle()

  if (action === 'clock-in') {
    if (record?.clock_in) {
      return jsonError('You already clocked in today')
    }
    const { data: created, error } = await supabase
      .from('attendance_records')
      .insert({ user_id: ctx.userId, date: today, clock_in: now.toISOString(), note: note || null })
      .select('id')
      .single()
    if (error) return jsonError(error.message, 500)
    await logAuditAction(supabase, 'attendance.clock_in', 'attendance_record', created.id)
    return jsonOk({ success: true, clockIn: now.toISOString() }, 201)
  }

  // clock-out
  if (!record?.clock_in) {
    return jsonError('You have not clocked in today')
  }
  if (record.clock_out) {
    return jsonError('You already clocked out today')
  }
  const { error } = await supabase
    .from('attendance_records')
    .update({ clock_out: now.toISOString(), note: note || undefined })
    .eq('id', record.id)
  if (error) return jsonError(error.message, 500)
  await logAuditAction(supabase, 'attendance.clock_out', 'attendance_record', record.id)
  return jsonOk({ success: true, clockOut: now.toISOString() })
}