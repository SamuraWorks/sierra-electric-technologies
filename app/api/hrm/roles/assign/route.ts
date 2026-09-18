import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'

export async function POST(request: NextRequest) {
  const result = await requirePermission('roles.assign')
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const body = await request.json()
  const user_id = String(body.user_id ?? '')
  const role_slug = String(body.role_slug ?? '').trim()

  if (!user_id || !role_slug) {
    return jsonError('User and role are required')
  }

  const { data: role } = await supabase.from('roles').select('id, name, slug').eq('slug', role_slug).maybeSingle()
  if (!role) return jsonError('Unknown role', 400)

  const { data: user } = await supabase.from('profiles').select('id, display_name').eq('id', user_id).maybeSingle()
  if (!user) return jsonError('User not found', 404)

  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user_id)
    .eq('role_id', role.id)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    return jsonOk({ success: true, alreadyAssigned: true })
  }

  const { data: created, error } = await supabase
    .from('user_roles')
    .insert({
      user_id,
      role_id: role.id,
      granted_by: ctx.userId,
      is_active: true,
    })
    .select('id, role:roles(name, slug)')
    .single()

  if (error) return jsonError(error.message, 500)

  await logAuditAction(supabase, 'role.assign', 'user_role', created.id, null, {
    user_id,
    display_name: user.display_name,
    role_slug,
    role_name: role.name,
  })

  return jsonOk({ success: true, id: created.id }, 201)
}