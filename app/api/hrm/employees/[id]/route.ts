import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await requirePermission('employees.manage')
  if ('error' in result) return result.error

  const { supabase } = result
  const body = await request.json()

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, display_name, email, employee_id, position, department, phone')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return jsonError('Employee not found', 404)
  }

  const patch: Record<string, unknown> = {}

  const textFields = [
    'display_name',
    'position',
    'department',
    'employee_id',
    'phone',
    'address',
    'emergency_contact',
    'gender',
  ] as const

  for (const field of textFields) {
    if (field in body) {
      const value = String(body[field] ?? '').trim()
      patch[field] = value || null
    }
  }

  if ('date_of_birth' in body && body.date_of_birth) {
    patch.date_of_birth = String(body.date_of_birth)
  }

  if ('email' in body) {
    const email = String(body.email ?? '').trim().toLowerCase()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) {
      return jsonError('A valid email address is required')
    }
    const { data: dup } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .maybeSingle()
    if (dup) {
      return jsonError('Another account already uses this email', 409)
    }
    patch.email = email
  }

  if ('employee_id' in patch && patch.employee_id) {
    const { data: dup } = await supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', String(patch.employee_id))
      .neq('id', id)
      .maybeSingle()
    if (dup) {
      return jsonError('That employee ID is already in use', 409)
    }
  }

  if (Object.keys(patch).length === 0) {
    return jsonError('Nothing to update')
  }

  const previous = {
    display_name: existing.display_name,
    email: existing.email,
    employee_id: existing.employee_id,
    position: existing.position,
    department: existing.department,
    phone: existing.phone,
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) {
    return jsonError(error.message, 500)
  }

  await logAuditAction(supabase, 'employee.update', 'profile', id, previous, {
    ...previous,
    ...patch,
  })

  return jsonOk({ success: true })
}