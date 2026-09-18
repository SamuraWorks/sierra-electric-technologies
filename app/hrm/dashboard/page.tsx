import Link from 'next/link'
import { getAuthContext, getPrimaryRole, hasPermission } from '@/lib/hrm/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const ctx = await getAuthContext()
  const supabase = await createClient()

  const [employeeCountRes, pendingLeaveRes, candidateCountRes] = await Promise.all([
    ctx && hasPermission(ctx, 'employees.view')
      ? supabase.from('profiles').select('*', { count: 'exact', head: true })
      : Promise.resolve({ count: null }),
    ctx && hasPermission(ctx, 'leave.view')
      ? supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('type', 'leave')
      : Promise.resolve({ count: null }),
    ctx && hasPermission(ctx, 'candidates.view')
      ? supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('type', 'application')
      : Promise.resolve({ count: null }),
  ])

  const primaryRole = ctx ? getPrimaryRole(ctx) : null

  const cards: { label: string; value: string; href?: string; visible: boolean }[] = [
    { label: 'Active staff', value: String(employeeCountRes.count ?? 0), href: '/hrm/employees', visible: hasPermission(ctx, 'employees.view') },
    { label: 'Leave requests', value: String(pendingLeaveRes.count ?? 0), href: '/hrm/leave', visible: hasPermission(ctx, 'leave.view') },
    { label: 'Candidates', value: String(candidateCountRes.count ?? 0), href: '/hrm/candidates', visible: hasPermission(ctx, 'candidates.view') },
  ].filter((c) => c.visible)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
          Sierra Electric Technologies
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--text)]">
          Hello, {ctx?.profile?.display_name ?? 'there'}.
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {primaryRole ? `${primaryRole.name} — internal management portal.` : 'Internal management portal.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const inner = (
            <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--sh-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--line-accent)]">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                {card.label}
              </p>
              <p className="mt-3 font-display text-4xl font-semibold text-[var(--text)]">{card.value}</p>
            </div>
          )
          return card.href ? (
            <Link key={card.label} href={card.href}>
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          )
        })}
      </div>

      <div className="mt-10 rounded-[var(--r-md)] border border-[var(--line-2)] bg-[var(--surface)] p-6">
        <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          Role summary
        </p>
        <div className="space-y-2">
          {ctx?.roles.map((ur) => (
            <div key={ur.id} className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <span className="text-sm font-medium text-[var(--text-2)]">{ur.role?.name}</span>
              <span className="rounded-full border border-[rgba(47,154,91,0.35)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">
                {ur.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
          {(!ctx || ctx.roles.length === 0) && (
            <p className="text-sm text-[var(--muted)]">No roles assigned yet.</p>
          )}
        </div>
        <div className="mt-6 max-h-48 space-y-1 overflow-y-auto">
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Permissions ({ctx?.permissions.size ?? 0})
          </p>
          {Array.from(ctx?.permissions ?? []).sort().map((perm) => (
            <p key={perm} className="font-mono text-[10px] tracking-[0.06em] text-[var(--muted)]">
              {perm}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}