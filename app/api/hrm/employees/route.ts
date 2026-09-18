import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const result = await requirePermission('employees.manage')
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const body = await request.json()

  const displayName = String(body.display_name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const position = String(body.position ?? '').trim()
  const department = String(body.department ?? '').trim()
  const employeeId = String(body.employee_id ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const address = String(body.address ?? '').trim()
  const roleSlug = String(body.role_slug ?? '').trim()

  if (!displayName || !email) {
    return jsonError('Display name and email are required')
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(email)) {
    return jsonError('A valid email address is required')
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) {
    return jsonError('An account with this email already exists', 409)
  }

  if (employeeId) {
    const { data: dup } = await supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', employeeId)
      .maybeSingle()
    if (dup) {
      return jsonError('That employee ID is already in use', 409)
    }
  }

  const password = String(body.password ?? '').trim() || 'Demo@1234'
  if (password.length < 8) {
    return jsonError('Password must be at least 8 characters')
  }

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (createError || !created.user) {
    return jsonError(createError?.message ?? 'Failed to create user account', 500)
  }

  const userId = created.user.id

  const patch: Record<string, unknown> = {
    display_name: displayName,
    email,
    position: position || null,
    department: department || null,
    employee_id: employeeId || null,
    phone: phone || null,
    address: address || null,
    must_change_password: false,
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)

  if (updateError) {
    return jsonError(updateError.message, 500)
  }

  if (roleSlug) {
    const { data: role } = await supabase.from('roles').select('id').eq('slug', roleSlug).maybeSingle()
    if (role) {
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role_id: role.id,
        is_active: true,
      })
      if (roleError) {
        return jsonError(roleError.message, 500)
      }
    }
  }

  await logAuditAction(supabase, 'employee.create', 'profile', userId, null, {
    display_name: displayName,
    email,
    employee_id: employeeId,
    position,
    department,
    role_slug: roleSlug || null,
  })

  return jsonOk({ success: true, id: userId })
}