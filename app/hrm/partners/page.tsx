import { redirect } from 'next/navigation'
import { Handshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'

export const metadata = { title: 'Partner Gigs' }

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  negotiating: 'bg-amber-50 text-amber-700',
  won: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-slate-100 text-slate-500',
}

const fmtLe = (n: number) => `Le ${Math.round(n).toLocaleString('en-US')}`

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'partners.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()

  let query = supabase
    .from('partner_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (status && ['new', 'negotiating', 'won', 'lost'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data: rows } = await query

  const gigs = ((rows ?? []) as Record<string, unknown>[]).map((g) => ({
    id: String(g.id),
    company: String(g.company_name ?? ''),
    contactName: g.contact_name ? String(g.contact_name) : null,
    contactEmail: g.contact_email ? String(g.contact_email) : null,
    contactPhone: g.contact_phone ? String(g.contact_phone) : null,
    gigTitle: String(g.gig_title ?? ''),
    description: g.description ? String(g.description) : null,
    expectedValue: Number(g.expected_value) || 0,
    status: String(g.status ?? 'new'),
    createdAt: g.created_at ? String(g.created_at) : null,
  }))

  const statuses = ['new', 'negotiating', 'won', 'lost']

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <Handshake size={13} /> Sierra Electric Technologies — Growth
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Partner gigs</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gigs and opportunities from partners that reached out. {gigs.length} total
          {status ? ` (filtered by "${status}")` : ''}.
        </p>
      </div>

      {/* Status filter */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <a
          href="/hrm/partners"
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            !status ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          All
        </a>
        {statuses.map((s) => (
          <a
            key={s}
            href={`/hrm/partners?status=${s}`}
            className={`capitalize rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              status === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10.5px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-6 py-3.5 font-semibold">Company / gig</th>
                <th className="hidden px-6 py-3.5 font-semibold md:table-cell">Contact</th>
                <th className="hidden px-6 py-3.5 font-semibold sm:table-cell">Expected value</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="hidden px-6 py-3.5 font-semibold lg:table-cell">Received</th>
              </tr>
            </thead>
            <tbody>
              {gigs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    No partner gigs{status ? ` under "${status}"` : ''} yet.
                  </td>
                </tr>
              )}
              {gigs.map((g) => (
                <tr key={g.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{g.company}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{g.gigTitle}</p>
                    {g.description && <p className="mt-1 max-w-md truncate text-xs text-slate-500">{g.description}</p>}
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
                    {g.contactName && <p className="text-slate-700">{g.contactName}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {g.contactEmail || g.contactPhone || '—'}
                    </p>
                  </td>
                  <td className="hidden px-6 py-4 font-mono text-slate-700 sm:table-cell">
                    {fmtLe(g.expectedValue)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[g.status] ?? 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-xs text-slate-400 lg:table-cell">
                    {g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
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