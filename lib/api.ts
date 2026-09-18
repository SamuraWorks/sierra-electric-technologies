// ============================================================
// API helpers — standard auth/permission checks for route handlers
// ============================================================
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission, type AuthContext } from '@/lib/hrm/auth'
import type { Permission } from '@/lib/hrm/permissions'

export type ApiResponse<T = unknown> = NextResponse<T | { error: string }>

export function jsonOk<T>(data: T, status = 200): ApiResponse<T> {
  return NextResponse.json(data, { status })
}

export function jsonError(message: string, status = 400): ApiResponse {
  return NextResponse.json({ error: message }, { status })
}

export async function requireAuth(): Promise<{ ctx: AuthContext; supabase: Awaited<ReturnType<typeof createClient>> } | { error: ApiResponse }> {
  const supabase = await createClient()
  const ctx = await getAuthContext()
  if (!ctx) {
    return { error: jsonError('Unauthorized', 401) }
  }
  return { ctx, supabase }
}

export async function requirePermission(permission: Permission): Promise<{ ctx: AuthContext; supabase: Awaited<ReturnType<typeof createClient>> } | { error: ApiResponse }> {
  const result = await requireAuth()
  if ('error' in result) return result
  if (!hasPermission(result.ctx, permission)) {
    return { error: jsonError('Forbidden — insufficient permissions', 403) }
  }
  return result
}

export async function requireAnyPermission(permissions: Permission[]): Promise<{ ctx: AuthContext; supabase: Awaited<ReturnType<typeof createClient>> } | { error: ApiResponse }> {
  const result = await requireAuth()
  if ('error' in result) return result
  const { hasAnyPermission: check } = await import('@/lib/hrm/auth')
  if (!check(result.ctx, permissions)) {
    return { error: jsonError('Forbidden — insufficient permissions', 403) }
  }
  return result
}

export async function requireAdmin(): Promise<{ ctx: AuthContext; supabase: Awaited<ReturnType<typeof createClient>> } | { error: ApiResponse }> {
  const result = await requireAuth()
  if ('error' in result) return result
  const { isAdmin } = await import('@/lib/hrm/auth')
  if (!isAdmin(result.ctx)) {
    return { error: jsonError('Forbidden — insufficient permissions', 403) }
  }
  return result
}

export async function logAuditAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  targetType: string,
  targetId: string | null,
  previousValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
) {
  await supabase.rpc('log_audit', {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_previous_value: previousValue ?? null,
    p_new_value: newValue ?? null,
  })
}

export async function paginate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  options: {
    page?: number
    limit?: number
    filters?: Record<string, unknown>
    order?: { column: string; ascending?: boolean }
    select?: string
  } = {},
) {
  const { page = 1, limit = 20, filters = {}, order, select = '*' } = options
  const offset = (page - 1) * limit

  let query = supabase.from(table).select(select, { count: 'exact' })

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value)
    }
  }

  if (order) {
    query = query.order(order.column, { ascending: order.ascending ?? false })
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    return { data: null, total: 0, page, limit, totalPages: 0, error: error.message }
  }

  return {
    data,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
    error: null,
  }
}