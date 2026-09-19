import { redirect } from 'next/navigation'
import { ShieldCheck, UserCog } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'

export const metadata = { title: 'Users' }

const ROLE_BADGE: Record<string, string> = {
  'system-admin': 'bg-blue-600 text-white',
  ceo: 'bg-violet-700 text-white',
  'co-founder': 'bg-indigo-600 text-white',
  administrator: 'bg-amber-500 text-white',
  employee: 'bg-slate-100 text-slate-600',
}

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'

export default async function UsersPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'users.manage')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const admin = createAdminClient()

  const [{ data: profileRows }, { data: roleRows }, authList] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('user_roles').select('user_id, is_active, role:roles(name, slug)').eq('is_active', true),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ])

  const rolesByUser = new Map<string, { name: string; slug: string }[]>()
  for (const r of (roleRows ?? []) as Record<string, unknown>[]) {
    const role = Array.isArray(r.role) ? r.role[0] : r.role
    if (!role) continue
    const uid = String(r.user_id)
    const entry = rolesByUser.get(uid) ?? []
    entry.push({
      name: String((role as Record<string, unknown>).name ?? ''),
      slug: String((role as Record<string, unknown>).slug ?? ''),
    })
    rolesByUser.set(uid, entry)
  }

  const authById = new Map<string, Record<string, unknown>>()
  for (const u of authList?.data?.users ?? []) {
    authById.set(u.id, u as unknown as Record<string, unknown>)
  }

  const users = ((profileRows ?? []) as Record<string, unknown>[]).map((p) => {
    const id = String(p.id)
    const authUser = authById.get(id)
    const bannedUntil = authUser?.banned_until ? String(authUser.banned_until) : null
    const disabled = bannedUntil ? new Date(bannedUntil).getTime() > Date.now() : false
    return {
      id,
      name: String(p.display_name ?? 'Unnamed'),
      email: String(p.email ?? authUser?.email ?? ''),
      employeeId: p.employee_id ? String(p.employee_id) : null,
      position: p.position ? String(p.position) : null,
      roles: rolesByUser.get(id) ?? [],
      disabled,
      mustChange: p.must_change_password === true,
      lastSignIn: authUser?.last_sign_in_at ? String(authUser.last_sign_in_at) : null,
      createdAt: p.created_at ? String(p.created_at) : null,
    }
  })

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <ShieldCheck size={13} /> Sierra Electric — Administration
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Users</h1>
        <p className="mt-2 text-sm text-slate-500">
          System accounts, roles and access. Staff records are managed under People → Staff.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Total accounts</p>
          <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Privileged</p>
          <p className="mt-1 font-display text-2xl font-semibold text-slate-900">
            {users.filter((u) => u.roles.some((r) => r.slug !== 'employee')).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Disabled</p>
          <p className="mt-1 font-display text-2xl font-semibold text-slate-900">
            {users.filter((u) => u.disabled).length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10.5px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-6 py-3.5 font-semibold">User</th>
                <th className="hidden px-6 py-3.5 font-semibold md:table-cell">Employee ID</th>
                <th className="px-6 py-3.5 font-semibold">Roles</th>
                <th className="hidden px-6 py-3.5 font-semibold lg:table-cell">Last sign in</th>
                <th className="hidden px-6 py-3.5 font-semibold xl:table-cell">Created</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                        {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium text-slate-900">
                          {u.name}
                          {u.mustChange && <UserCog size={13} className="text-amber-500" />}
                        </p>
                        <p className="truncate text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-600 md:table-cell">{u.employeeId ?? '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.length === 0 && <span className="text-xs text-slate-400">No role</span>}
                      {u.roles.map((r) => (
                        <span
                          key={r.slug}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[r.slug] ?? ROLE_BADGE.employee}`}
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-600 lg:table-cell">{fmtDateTime(u.lastSignIn)}</td>
                  <td className="hidden px-6 py-4 text-slate-600 xl:table-cell">{fmtDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        u.disabled
                          ? 'rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700'
                          : 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700'
                      }
                    >
                      {u.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}