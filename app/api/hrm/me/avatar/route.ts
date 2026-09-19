import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requireAuth, logAuditAction } from '@/lib/api'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'avatars'

function describeUploadError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('bucket') || m.includes('already exists') || m.includes('not found')) {
    return 'Profile picture storage is not ready yet. Please run the latest database migration, then try again.'
  }
  return message
}

export async function POST(request: NextRequest) {
  const result = await requireAuth()
  if ('error' in result) return result.error
  const { ctx, supabase } = result

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!file || !(file instanceof File)) return jsonError('No image file provided', 400)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonError('Unsupported image type. Use JPG, PNG or WebP.', 400)
  }
  if (file.size > MAX_BYTES) return jsonError('Image must be 2MB or smaller.', 400)

  const bytes = new Uint8Array(await file.arrayBuffer())
  const ext = file.type === 'image/jpeg' ? 'jpg' : (file.type.split('/')[1] ?? 'png')
  const path = `${ctx.userId}/avatar-${Date.now()}.${ext}`

  // Best-effort: make sure the bucket exists (needs SUPABASE_SERVICE_ROLE_KEY).
  // On production without the key, the bucket is pre-created by migrations.
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { data: buckets } = await admin.storage.listBuckets()
    if (!buckets?.some((b) => b.name === BUCKET)) {
      await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES })
    }
  } catch {
    // service-role key unavailable — rely on the migrated bucket
  }

  // Upload with the signed-in user account through storage RLS policies
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  })
  if (uploadError) return jsonError(describeUploadError(uploadError.message), 400)

  const photoUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

  const { error } = await supabase.from('profiles').update({ photo_url: photoUrl }).eq('id', ctx.userId)
  if (error) return jsonError(error.message, 400)

  try {
    await logAuditAction(supabase, 'profile.avatar.update', 'profiles', ctx.userId, null, { photo_url: photoUrl })
  } catch {
    // auditing is best-effort
  }

  return jsonOk({ success: true, photoUrl })
}