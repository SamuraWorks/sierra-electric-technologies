import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requireAuth, logAuditAction } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'

const UPDATE_FIELDS = ['display_name', 'phone', 'email', 'photo_url'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function PATCH(request: NextRequest) {
  const result = await requireAuth()
  if ('error' in result) return result.error
  const { ctx, supabase } = result

  const body = await request.json().catch(() => ({}))
  const clean: Record<string, unknown> = {}

  for (const key of UPDATE_FIELDS) {
    const raw = (body as Record<string, unknown>)[key]
    if (raw === undefined) continue
    const value = typeof raw === 'string' ? raw.trim() : raw
    clean[key] = value === '' ? null : value
  }

  if (!('display_name' in clean)) clean.display_name = String(ctx.profile?.display_name ?? '')

  if (Object.keys(clean).length === 0) return jsonError('No fields to update', 400)
  if (!clean.display_name || !String(clean.display_name).trim()) {
    return jsonError('Your name cannot be empty', 400)
  }

  const admin = createAdminClient()
  const currentEmail = String(ctx.profile?.email ?? '')
  const newEmail = clean.email ? String(clean.email) : null

  if (newEmail && newEmail !== currentEmail) {
    if (!EMAIL_RE.test(newEmail)) return jsonError('Please enter a valid email address', 400)
    const { error: authError } = await admin.auth.admin.updateUserById(ctx.userId, {
      email: newEmail,
      email_confirm: true,
    })
    if (authError) return jsonError(authError.message, 400)
  } else {
    delete clean.email
  }

  const { error } = await admin.from('profiles').update(clean).eq('id', ctx.userId)
  if (error) return jsonError(error.message, 400)

  await logAuditAction(supabase, 'profile.update', 'profiles', ctx.userId, null, clean)

  return jsonOk({ success: true, profile: clean })
}