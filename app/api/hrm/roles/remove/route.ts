import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'

export async function POST(request: NextRequest) {
  const result = await requirePermission('roles.remove')
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

  const { data: assignment } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user_id)
    .eq('role_id', role.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!assignment) {
    return jsonOk({ success: true, alreadyRemoved: true })
  }

  const { error } = await supabase
    .from('user_roles')
    .update({ is_active: false })
    .eq('id', assignment.id)

  if (error) return jsonError(error.message, 500)

  await logAuditAction(supabase, 'role.remove', 'user_role', assignment.id, {
    user_id,
    role_slug: role.slug,
    role_name: role.name,
  }, { is_active: false })

  return jsonOk({ success: true })
}