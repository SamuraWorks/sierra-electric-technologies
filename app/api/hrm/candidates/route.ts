import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'

const SOURCES = ['website', 'referral', 'job-board', 'walk-in', 'media', 'other']
const STATUSES = ['new', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected']

export async function POST(request: NextRequest) {
  const result = await requirePermission('candidates.review')
  if ('error' in result) return result.error

  const { supabase, ctx } = result
  const body = await request.json()

  const display_name = String(body.display_name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const position_applied = String(body.position_applied ?? '').trim()
  const source = String(body.source ?? 'website').trim()

  if (!display_name || !email) return jsonError('Name and email are required')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('A valid email is required')
  if (!SOURCES.includes(source)) return jsonError('Invalid source')

  const { data: existing } = await supabase
    .from('candidates')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) return jsonError('A candidate with this email already exists', 409)

  const { data: created, error } = await supabase
    .from('candidates')
    .insert({
      display_name,
      email,
      phone: phone || null,
      position_applied: position_applied || null,
      source,
      status: 'new',
    })
    .select('id')
    .single()

  if (error) return jsonError(error.message, 500)

  await logAuditAction(supabase, 'candidate.create', 'candidate', created.id, null, {
    display_name,
    email,
    position_applied,
    source,
  })

  return jsonOk({ success: true, id: created.id }, 201)
}