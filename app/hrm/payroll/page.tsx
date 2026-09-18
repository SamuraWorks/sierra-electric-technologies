import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { RunPayrollButton } from '@/components/hrm/run-payroll'

export const metadata = { title: 'Payroll' }

function fmt(amount: number | string | null | undefined, currency = 'SLL') {
  return `${currency === 'SLL' ? 'Le ' : ''}${Number(amount ?? 0).toLocaleString([], { maximumFractionDigits: 0 })}`
}

export default async function PayrollPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'payroll.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const canRun = hasPermission(ctx, 'payroll.run')

  const [salariesRes, runsRes] = await Promise.all([
    supabase
      .from('salary_configs')
      .select('user_id, gross_salary, currency, bank_name, bank_account, owner:user_id(display_name, employee_id, position)'),
    supabase.from('payroll_runs').select('id, month, label, status, processed_at, created_at').order('processed_at', { ascending: false }),
  ])

  const salaries = ((salariesRes.data ?? []) as Record<string, unknown>[]).map((s) => ({
    user_id: String(s.user_id),
    gross_salary: s.gross_salary as number,
    currency: String(s.currency ?? 'SLL'),
    bank_name: (s.bank_name as string | null) ?? null,
    bank_account: (s.bank_account as string | null) ?? null,
    owner: (Array.isArray(s.owner) ? s.owner[0] : s.owner) ?? ({} as Record<string, unknown>),
  }))
  salaries.sort((a, b) => Number(a.gross_salary ?? 0) - Number(b.gross_salary ?? 0))

  const runs = (runsRes.data ?? []) as { id: string; month: string; label: string; status: string; processed_at: string }[]
  const currentRun = runs[0]
  const currentRunId = currentRun?.id

  const monthlyTotal = salaries.reduce((acc, s) => acc + Number(s.gross_salary ?? 0), 0)

  // Entries for the latest run
  let entries: { user_id: string; gross_salary: number; deductions: number; net_salary: number }[] = []
  if (currentRunId) {
    const { data: entriesRes } = await supabase
      .from('payroll_entries')
      .select('user_id, gross_salary, deductions, net_salary')
      .eq('run_id', currentRunId)
    entries = (entriesRes ?? []) as typeof entries
  }

  const entryByUser = new Map(entries.map((e) => [e.user_id, e]))

  function initials(name: string) {
    return String(name)
      .split(' ')
      .map((n: string) => n[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Sierra Electric Technologies — Finance
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text)]">Payroll</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {salaries.length} staff on payroll · monthly total{' '}
            <span className="font-semibold text-[var(--text)]">{fmt(monthlyTotal)}</span>
          </p>
        </div>
        {canRun && <RunPayrollButton currentMonthExists={!!currentRun && currentRun.month === new Date().toISOString().slice(0, 7)} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest run */}
        <section>
          <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Latest run{currentRun ? ` — ${currentRun.label}` : ''}
          </p>
          <div className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)]">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5 text-right">Gross</th>
                  <th className="px-5 py-3.5 text-right">Deductions</th>
                  <th className="px-5 py-3.5 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s) => {
                  const entry = entryByUser.get(s.user_id)
                  return (
                    <tr key={s.user_id} className="border-b border-[var(--line)] last:border-0 transition-colors hover:bg-[var(--surface-2)]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-[10px] font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
                            {initials(String(s.owner.display_name ?? '?'))}
                          </span>
                          <span>
                            <span className="block font-semibold text-[var(--text)]">{String(s.owner.display_name ?? '—')}</span>
                            <span className="block font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
                              {String(s.owner.employee_id ?? '')} · {String(s.owner.position ?? '')}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[var(--text-2)]">
                        {fmt(s.gross_salary, s.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[var(--muted)]">
                        {entry ? fmt(entry.deductions, s.currency) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-[var(--text)]">
                        {entry ? fmt(entry.net_salary, s.currency) : '—'}
                      </td>
                    </tr>
                  )
                })}
                {salaries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center text-sm text-[var(--muted)]">
                      No salaries configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Salary configs */}
        <section>
          <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Salary configurations
          </p>
          <div className="space-y-3">
            {salaries.map((s) => (
              <div key={s.user_id} className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text)]">{String(s.owner.display_name ?? '—')}</p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {s.bank_name ?? 'Bank not set'} {s.bank_account ? `· ${s.bank_account}` : ''}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold text-[var(--text)]">{fmt(s.gross_salary, s.currency)}</p>
                </div>
              </div>
            ))}
            {salaries.length === 0 && (
              <p className="rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] p-8 text-center text-sm text-[var(--muted)]">
                No salary configurations yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}