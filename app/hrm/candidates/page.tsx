import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { CandidateCard } from '@/components/hrm/candidate-card'

export const metadata = { title: 'Candidates' }

export const PIPELINE: { value: string; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'offered', label: 'Offered' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
]

export default async function CandidatesPage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'candidates.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()
  const canManage = hasPermission(ctx, 'candidates.review')

  const { data: rows } = await supabase
    .from('candidates')
    .select('id, display_name, email, position_applied, source, status, last_contacted_at')
    .order('created_at', { ascending: false })

  const candidates = rows ?? []

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Sierra Electric Technologies — Recruitment
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text)]">Candidates</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{candidates.length} applicants in the pipeline</p>
        </div>
        {canManage && (
          <Link
            href="/hrm/candidates/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)] shadow-sm transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Plus className="size-4" />
            Add candidate
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {PIPELINE.map((stage) => {
          const inStage = candidates.filter((c) => c.status === stage.value)
          return (
            <div key={stage.value} className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-3">
              <p className="mb-3 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                <span>{stage.label}</span>
                <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)]">
                  {inStage.length}
                </span>
              </p>
              <div className="space-y-2.5">
                {inStage.map((c) => (
                  <CandidateCard
                    key={c.id}
                    id={c.id}
                    displayName={c.display_name}
                    email={c.email}
                    position={c.position_applied}
                    source={c.source}
                    canManage={canManage}
                  />
                ))}
                {inStage.length === 0 && (
                  <p className="rounded-lg border border-dashed border-[var(--line-2)] px-3 py-5 text-center text-[11px] text-[var(--muted)]">
                    Empty
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}