import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'

export const metadata = { title: 'Leave' }

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'border-[#e0a03b] bg-[#fff8e6] text-[#9c6b1f]' },
  approved: { label: 'Approved', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700' },
  rejected: { label: 'Rejected', cls: 'border-red-400/50 bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelled', cls: 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]' },
}

function initials(name: string) {
  return String(name)
    .split(' ')
    .map((n: string) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'leave.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const filter = (status ?? '').trim()

  const canReview = hasPermission(ctx, 'leave.approve')

  let query = supabase
    .from('leave_requests')
    .select('*, user:user_id(display_name, email, employee_id, position), leave_type:leave_type_id(name, slug)')
    .order('created_at', { ascending: false })

  const isPeopleOps = ctx.roleSlugs.some((s) =>
    ['hr-manager', 'manager', 'system-admin'].includes(s),
  )
  if (!isPeopleOps) {
    query = query.eq('user_id', ctx.userId)
  }
  if (filter && ['pending', 'approved', 'rejected', 'cancelled'].includes(filter)) {
    query = query.eq('status', filter)
  }

  const { data: rows } = await query

  const requests = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    user_id: String(r.user_id),
    start_date: String(r.start_date),
    end_date: String(r.end_date),
    reason: (r.reason as string | null) ?? '',
    status: String(r.status),
    review_note: (r.review_note as string | null) ?? '',
    statusLabel: STATUS_STYLE[String(r.status)]?.label ?? String(r.status),
    statusCls: STATUS_STYLE[String(r.status)]?.cls ?? '',
    user: (Array.isArray(r.user) ? r.user[0] : r.user) ?? ({} as Record<string, unknown>),
    leave_type: (Array.isArray(r.leave_type) ? r.leave_type[0] : r.leave_type) ?? ({} as Record<string, unknown>),
  }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Sierra Electric Technologies — HR
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text)]">Leave</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {isPeopleOps ? 'All requests across the company' : 'Your leave requests'}
          </p>
        </div>
        <Link
          href="/hrm/leave/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)] shadow-sm transition-colors hover:bg-[var(--accent-hover)]"
        >
          <Plus className="size-4" />
          New request
        </Link>
      </div>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { value: '', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
        ].map((t) => {
          const active = filter === t.value
          return (
            <Link
              key={t.value}
              href={t.value ? `/hrm/leave?status=${t.value}` : '/hrm/leave'}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                active
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'border border-[var(--line-2)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      <div className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)]">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="hidden px-5 py-3.5 md:table-cell">Dates</th>
              <th className="hidden px-5 py-3.5 sm:table-cell">Reason</th>
              <th className="px-5 py-3.5">Status</th>
              {canReview && <th className="px-5 py-3.5 text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-[var(--line)] last:border-0 transition-colors hover:bg-[var(--surface-2)]">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-xs font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
                      {initials(String(r.user.display_name ?? '?'))}
                    </span>
                    <span>
                      <span className="block font-semibold text-[var(--text)]">
                        {String(r.user.display_name ?? '—')}
                      </span>
                      {isPeopleOps && (
                        <span className="block font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
                          {(r.user.employee_id as string) ?? ''}
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[var(--text-2)]">{String(r.leave_type.name ?? '—')}</td>
                <td className="hidden px-5 py-3.5 text-[var(--text-2)] md:table-cell">
                  {r.start_date} → {r.end_date}
                </td>
                <td className="hidden max-w-[16rem] truncate px-5 py-3.5 text-[var(--muted)] sm:table-cell" title={r.reason}>
                  {r.reason || '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${r.statusCls}`}>
                    {r.statusLabel}
                  </span>
                </td>
                {canReview && (
                  <td className="px-5 py-3.5 text-right">
                    {r.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <LeaveReviewButton requestId={r.id} decision="approved" note="Approved by manager" />
                        <LeaveReviewButton requestId={r.id} decision="rejected" note="Rejected by manager" />
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={canReview ? 6 : 5} className="px-5 py-16 text-center text-sm text-[var(--muted)]">
                  No leave requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LeaveReviewButton({
  requestId,
  decision,
  note,
}: {
  requestId: string
  decision: 'approved' | 'rejected'
  note: string
}) {
  return (
    <form action="/api/hrm/leave/review" method="post" className="inline-flex">
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="decision" value={decision} />
      <input type="hidden" name="note" value={note} />
      <button
        type="submit"
        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
          decision === 'approved'
            ? 'border border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10'
            : 'border border-red-400/50 text-red-700 hover:bg-red-50'
        }`}
      >
        {decision === 'approved' ? 'Approve' : 'Reject'}
      </button>
    </form>
  )
}