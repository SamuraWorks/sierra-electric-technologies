import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'

export const metadata = { title: 'Audit Log' }

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'audit.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const action = (q ?? '').trim()

  let query = supabase
    .from('audit_logs')
    .select('id, action, target_type, target_id, previous_value, new_value, created_at, actor:actor_id(display_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (action) query = query.eq('action', action)

  const { data: rows } = await query

  const logs = ((rows ?? []) as Record<string, unknown>[]).map((l) => {
    const act = String(l.action ?? '')
    return {
      id: String(l.id),
      action: act,
      target_type: String(l.target_type ?? ''),
      target_id: l.target_id ? String(l.target_id) : null,
      created_at: String(l.created_at),
      actor: (Array.isArray(l.actor) ? l.actor[0] : l.actor) ?? ({} as Record<string, unknown>),
      diff: act.startsWith('role.') ? { previous: l.previous_value, new: l.new_value } : null,
    }
  })

  const actions = Array.from(new Set(logs.map((l) => l.action))).sort()

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
          Sierra Electric Technologies — System
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--text)]">Audit log</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Read-only trail of sensitive actions. Shows {logs.length} of the most recent entries.
        </p>
      </div>

      {/* Filter */}
      <form method="get" action="/hrm/audit" className="mb-6 flex flex-wrap items-center gap-3">
        <select
          name="q"
          defaultValue={action}
          className="rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-2)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-[var(--line-2)] px-4 py-2 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
          Filter
        </button>
        {action && (
          <Link href="/hrm/audit" className="text-sm font-medium text-[var(--accent)]">
            Clear
          </Link>
        )}
      </form>

      <div className="space-y-3">
        {logs.map((l) => (
          <div
            key={l.id}
            className="flex flex-wrap items-center gap-3 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] px-5 py-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-[10px] font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
              {String(l.actor.display_name ?? '?')
                .split(' ')
                .map((n: string) => n[0])
                .filter(Boolean)
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-[var(--text)]">{String(l.actor.display_name ?? 'Unknown actor')}</span>
                <span className="text-[var(--muted)]">performed</span>
                <span className="rounded-full border border-[var(--line-2)] bg-[var(--surface-2)] px-2.5 py-0.5 font-mono text-[11px] tracking-[0.04em] text-[var(--accent)]">
                  {l.action}
                </span>
                <span className="text-[var(--muted)]">on</span>
                <span className="font-mono text-[11px] text-[var(--text-2)]">{l.target_type}</span>
                {l.target_id && <span className="font-mono text-[10px] text-[var(--muted)]">#{l.target_id.slice(0, 8)}</span>}
              </p>
              {l.diff && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--surface-2)] px-3 py-2 font-mono text-[10px] text-[var(--text-2)]">
                  {JSON.stringify(l.diff, null, 2)}
                </pre>
              )}
            </div>
            <span className="shrink-0 text-xs text-[var(--muted)]">
              {new Date(l.created_at).toLocaleString([], {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] p-10 text-center text-sm text-[var(--muted)]">
            No audit entries{action ? ` for “${action}”` : ''} yet.
          </p>
        )}
      </div>
    </div>
  )
}