import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { ROLE_PERMISSIONS } from '@/lib/hrm/permissions'
import { RoleAssignment } from '@/components/hrm/role-assignment'

export const metadata = { title: 'Roles & Assignments' }

export default async function RolesPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'roles.view')) {
    redirect('/hrm/dashboard')
  }

  const supabase = await createClient()

  const [rolesRes, userRolesRes, profilesRes] = await Promise.all([
    supabase.from('roles').select('id, name, slug, description, hierarchy_level, is_administrative').order('hierarchy_level', { ascending: true }),
    supabase
      .from('user_roles')
      .select('id, user_id, role_id, is_active, granted_at, roles:role_id(name, slug)')
      .eq('is_active', true)
      .order('granted_at', { ascending: false }),
    supabase.from('profiles').select('id, display_name, email, employee_id, position, department'),
  ])

  const roles = rolesRes.data ?? []
  const assignments = (userRolesRes.data ??
    []) as { id: string; user_id: string; role_id: string; is_active: boolean; granted_at: string; roles: { name: string; slug: string }[] }[]
  const profiles = profilesRes.data ?? []

  const roleOptions = roles.map((r) => ({ id: String(r.id), name: String(r.name), slug: String(r.slug) }))

  const userRows = profiles
    .map((p) => {
      const assigned = assignments.filter((a) => a.user_id === p.id)
      return {
        ...p,
        roles: assigned.map((a) => ({ id: a.id, roleId: a.role_id, name: a.roles?.[0]?.name ?? '', slug: a.roles?.[0]?.slug ?? '' })),
      }
    })
    .sort((a, b) => (a.employee_id ?? '').localeCompare(b.employee_id ?? ''))

  const canAssign = hasPermission(ctx, 'roles.assign')
  const canRemove = hasPermission(ctx, 'roles.remove')

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        Sierra Electric Technologies — HR
      </p>
      <h1 className="font-display text-3xl font-semibold text-[var(--text)]">Roles & Assignments</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        System roles, their permission sets, and every user&apos;s role assignment.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Roles + permissions */}
        <section>
          <h2 className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Roles ({roles.length})
          </h2>
          <div className="space-y-3">
            {roles.map((role) => {
              const key = role.slug as keyof typeof ROLE_PERMISSIONS
              const perms = ROLE_PERMISSIONS[key] ?? []
              return (
                <div key={role.id} className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                        {role.name}
                        {role.is_administrative && (
                          <span className="rounded-full border border-[rgba(47,154,91,0.35)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{role.description}</p>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--accent)]">
                      {role.slug}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {perms.map((perm) => (
                      <span
                        key={perm}
                        className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[9px] tracking-[0.04em] text-[var(--text-2)]"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Users + assignments */}
        <section>
          <h2 className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            People ({userRows.length})
          </h2>
          <div className="space-y-3">
            {userRows.map((u) => (
              <div key={u.id} className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text)]">{u.display_name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {u.position ?? '—'} {u.department && `· ${u.department}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">
                    {u.employee_id ?? '—'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <RoleAssignment
                    userId={u.id}
                    assignedRoles={u.roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug }))}
                    allRoles={roleOptions}
                    canAssign={canAssign}
                    canRemove={canRemove}
                  />
                  <span className="ml-auto font-mono text-[9px] tracking-[0.08em] text-[var(--muted)]">
                    {u.email ?? ''}
                  </span>
                </div>
              </div>
            ))}
            {userRows.length === 0 && (
              <p className="rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] p-8 text-center text-sm text-[var(--muted)]">
                No staff accounts yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}