import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/hrm/auth'
import { createClient } from '@/lib/supabase/server'
import { NewLeaveForm } from '@/components/hrm/leave-form'

export const metadata = { title: 'New Leave Request' }

export default async function NewLeavePage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')

  const supabase = await createClient()
  const { data: types } = await supabase.from('leave_types').select('id, name, slug, default_days').eq('is_active', true)
  const { data: balance } = await supabase
    .from('leave_requests')
    .select('start_date, end_date')
    .eq('user_id', ctx.userId)
    .eq('status', 'approved')

  const approvedDays = (balance ?? []).reduce((acc, r) => {
    const days = Math.round((new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) / 86400000) + 1
    return acc + Math.max(0, days)
  }, 0)

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        Sierra Electric Technologies — HR
      </p>
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">New leave request</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Approved leave taken so far: {approvedDays} days. Your manager will review the request.
      </p>

      <NewLeaveForm types={(types ?? []).map((t) => ({ id: t.id, name: t.name, default_days: t.default_days }))} />
    </div>
  )
}