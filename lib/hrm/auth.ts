// ============================================================
// Auth & RBAC Engine — server-side permission checks
// ============================================================
import { createClient } from '@/lib/supabase/server'
import type { UserProfile, UserRole, Role } from '@/lib/types/database'

export interface AuthContext {
  userId: string
  profile: UserProfile | null
  roles: UserRole[]
  permissions: Set<string>
  roleSlugs: string[]
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, rolesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('*, role:roles(*)').eq('user_id', user.id).eq('is_active', true),
  ])

  const userRoles = (rolesRes.data ?? []) as UserRole[]
  const roleSlugs = userRoles.map((ur) => ur.role?.slug).filter(Boolean) as string[]

  const permissions = new Set<string>()
  if (userRoles.length > 0) {
    const roleIds = userRoles.map((ur) => ur.role_id)
    const { data: perms } = await supabase
      .from('role_permissions')
      .select('permission')
      .in('role_id', roleIds)

    if (perms) {
      perms.forEach((p) => permissions.add(p.permission))
    }
  }

  const profile = {
    ...(profileRes.data ?? {}),
    user_roles: userRoles,
  } as UserProfile

  return {
    userId: user.id,
    profile,
    roles: userRoles,
    permissions,
    roleSlugs,
  }
}

export function hasPermission(ctx: AuthContext | null, permission: string): boolean {
  return ctx?.permissions.has(permission) ?? false
}

export function hasAnyPermission(ctx: AuthContext | null, perms: string[]): boolean {
  if (!ctx) return false
  return perms.some((p) => ctx.permissions.has(p))
}

export function hasRole(ctx: AuthContext | null, slug: string): boolean {
  return ctx?.roleSlugs.includes(slug) ?? false
}

export function hasAnyRole(ctx: AuthContext | null, slugs: string[]): boolean {
  if (!ctx) return false
  return slugs.some((s) => ctx.roleSlugs.includes(s))
}

export function isAdmin(ctx: AuthContext | null): boolean {
  return hasRole(ctx, 'system-admin')
}

// Full-access tiers: System Admin, CEO, Co-Founder
export function isFullAccess(ctx: AuthContext | null): boolean {
  return hasAnyRole(ctx, ['system-admin', 'ceo', 'co-founder'])
}

export function isHR(ctx: AuthContext | null): boolean {
  return hasRole(ctx, 'administrator') || isAdmin(ctx)
}

export function getPrimaryRole(ctx: AuthContext | null): Role | null {
  if (!ctx || ctx.roles.length === 0) return null
  return ctx.roles.sort((a, b) => (a.role?.hierarchy_level ?? 99) - (b.role?.hierarchy_level ?? 99))[0]?.role ?? null
}