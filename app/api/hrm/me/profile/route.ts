import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requireAuth, logAuditAction } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
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
  if (!clean.display_name || !String(clean.display_name).trim()) {
    return jsonError('Your name cannot be empty', 400)
  }

  const currentEmail = String(ctx.profile?.email ?? '')
  const newEmail = clean.email ? String(clean.email) : null

  // --- Email changed? Sync auth.users via the admin client (best-effort).
  // The profiles row still updates regardless — RLS guards own-row edits.
  let emailWarning: string | null = null

  if (newEmail && newEmail !== currentEmail) {
    if (!EMAIL_RE.test(newEmail)) return jsonError('Please enter a valid email address', 400)
    try {
      const admin = createAdminClient()
      const { error: authError } = await admin.auth.admin.updateUserById(ctx.userId, {
        email: newEmail,
        email_confirm: true,
      })
      if (authError) {
        emailWarning = `Email could not be applied (${authError.message}). Your other details were saved — contact IT if this matters.`
      }
    } catch {
      emailWarning =
        'Email could not be applied (service-role key not configured on this server). Your other details were saved — contact IT to change the email.'
    }
  } else {
    delete clean.email
  }

  // Profile row is written through the session client so it works on Vercel
  // without the service-role key (RLS "Users can update own profile").
  const { error } = await supabase.from('profiles').update(clean).eq('id', ctx.userId)
  if (error) return jsonError(error.message, 400)

  await logAuditAction(supabase, 'profile.update', 'profiles', ctx.userId, null, clean)

  return jsonOk({ success: true, profile: clean, emailWarning })
}
