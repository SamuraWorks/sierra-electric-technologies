import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requireAuth, logAuditAction } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'avatars'

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
  const ext = file.type.split('/')[1] ?? 'png'
  const path = `${ctx.userId}/avatar-${Date.now()}.${ext}`

  const admin = createAdminClient()
  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, { public: true })
  }

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  })
  if (uploadError) return jsonError(uploadError.message, 400)

  const { data: url } = admin.storage.from(BUCKET).getPublicUrl(path)
  const photoUrl = url.publicUrl

  const { error } = await admin.from('profiles').update({ photo_url: photoUrl }).eq('id', ctx.userId)
  if (error) return jsonError(error.message, 400)

  await logAuditAction(supabase, 'profile.avatar.update', 'profiles', ctx.userId, null, { photo_url: photoUrl })

  return jsonOk({ success: true, photoUrl })
}