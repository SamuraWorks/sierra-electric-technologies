import { redirect } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { QuickForm } from '@/components/hrm/quick-form'

export const metadata = { title: 'Payments' }

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  disputed: 'bg-red-50 text-red-700',
}

const money = (n: number, currency: string) =>
  `${currency ? currency + ' ' : ''}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default async function PaymentsPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'payments.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const canManage = hasPermission(ctx, 'payments.manage')

  const [{ data: payRows }, { data: profileRows }] = await Promise.all([
    supabase
      .from('payments')
      .select('id,amount,currency,period_label,paid_on,method,reference,confirmation_status,recipient:recipient_id(display_name)')
      .order('paid_on', { ascending: false }),
    supabase.from('profiles').select('id,display_name').neq('employee_id', null).order('display_name'),
  ])

  const payments = ((payRows ?? []) as Record<string, unknown>[]).map((p) => {
    const recipient = Array.isArray(p.recipient) ? p.recipient[0] : p.recipient
    return {
      id: String(p.id),
      amount: Number(p.amount) || 0,
      currency: p.currency ? String(p.currency) : 'SLE',
      period: p.period_label ? String(p.period_label) : null,
      paidOn: p.paid_on ? String(p.paid_on) : null,
      method: p.method ? String(p.method) : null,
      reference: p.reference ? String(p.reference) : null,
      status: String(p.confirmation_status ?? 'pending'),
      recipientName: recipient ? String((recipient as Record<string, unknown>).display_name ?? '') : 'Unknown',
    }
  })

  const total = payments.reduce((sum, p) => sum + p.amount, 0)
  const staffOptions = ((profileRows ?? []) as Record<string, unknown>[]).map((s) => ({
    value: String(s.id),
    label: String(s.display_name ?? ''),
  }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <Wallet size={13} /> Sierra Electric — Company
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Payments</h1>
        <p className="mt-2 text-sm text-slate-500">
          Payments made to staff and contractors, and their confirmation status.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Records</p>
          <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{payments.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Total paid</p>
          <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{money(total, 'SLE')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Pending confirmation</p>
          <p className="mt-1 font-display text-2xl font-semibold text-slate-900">
            {payments.filter((p) => p.status === 'pending').length}
          </p>
        </div>
      </div>

      {canManage && (
        <QuickForm
          endpoint="/api/hrm/records/payments"
          title="Record a payment"
          submitLabel="Record payment"
          fields={[
            { name: 'recipient_id', label: 'Recipient', type: 'select', required: true, options: staffOptions },
            { name: 'amount', label: 'Amount (SLE)', type: 'number', required: true },
            { name: 'period_label', label: 'Period', placeholder: 'e.g. August 2026' },
            { name: 'paid_on', label: 'Date paid', type: 'date', defaultValue: new Date().toISOString().slice(0, 10) },
            {
              name: 'method',
              label: 'Method',
              type: 'select',
              options: [
                { value: 'bank_transfer', label: 'Bank transfer' },
                { value: 'mobile_money', label: 'Mobile money' },
                { value: 'cash', label: 'Cash' },
                { value: 'cheque', label: 'Cheque' },
              ],
            },
            { name: 'reference', label: 'Reference', placeholder: 'Transaction / receipt no.' },
            {
              name: 'confirmation_status',
              label: 'Status',
              type: 'select',
              defaultValue: 'pending',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'disputed', label: 'Disputed' },
              ],
            },
          ]}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10.5px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-6 py-3.5 font-semibold">Recipient</th>
                <th className="px-6 py-3.5 font-semibold">Amount</th>
                <th className="hidden px-6 py-3.5 font-semibold md:table-cell">Period</th>
                <th className="hidden px-6 py-3.5 font-semibold lg:table-cell">Method</th>
                <th className="px-6 py-3.5 font-semibold">Date</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    No payment records yet.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{p.recipientName}</p>
                    {p.reference && <p className="text-xs text-slate-400">Ref: {p.reference}</p>}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{money(p.amount, p.currency)}</td>
                  <td className="hidden px-6 py-4 text-slate-600 md:table-cell">{p.period ?? '—'}</td>
                  <td className="hidden px-6 py-4 capitalize text-slate-600 lg:table-cell">
                    {p.method ? p.method.replace('_', ' ') : '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {p.paidOn ? new Date(p.paidOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status] ?? STATUS_BADGE.pending}`}>
                      {p.status}
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