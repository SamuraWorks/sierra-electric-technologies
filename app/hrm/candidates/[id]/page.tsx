import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { CandidateStatusControl } from '@/components/hrm/candidate-status'

export const metadata = { title: 'Candidate' }

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'candidates.view')) redirect('/hrm/candidates')

  const supabase = await createClient()
  const [candidateRes, notesRes] = await Promise.all([
    supabase.from('candidates').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('candidate_notes')
      .select('id, note, created_at, author:user_id(display_name)')
      .eq('candidate_id', id)
      .order('created_at', { ascending: false }),
  ])

  const candidate = candidateRes.data
  if (!candidate) notFound()

  const notes = (notesRes.data ?? []).map((n: Record<string, unknown>) => ({
    id: String(n.id),
    note: String(n.note),
    created_at: String(n.created_at),
    author: (Array.isArray(n.author) ? n.author[0] : n.author) ?? ({} as Record<string, unknown>),
  }))

  const canManage = hasPermission(ctx, 'candidates.review')

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/hrm/candidates"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        Back to candidates
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-[var(--surface-2)] text-lg font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
            {String(candidate.display_name)
              .split(' ')
              .map((n: string) => n[0])
              .filter(Boolean)
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--text)]">{candidate.display_name}</h1>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              {candidate.position_applied ?? 'Position —'}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              {candidate.email && (
                <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 text-[var(--accent)]">
                  <Mail className="size-3.5" /> {candidate.email}
                </a>
              )}
              {candidate.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {candidate.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
          Source: {candidate.source}
        </span>
      </div>

      {canManage && (
        <div className="mt-8 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
            Pipeline status
          </p>
          <CandidateStatusControl id={candidate.id} currentStatus={candidate.status} />
        </div>
      )}

      <div className="mt-6 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Interview notes
        </p>
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
              <p className="text-sm text-[var(--text)]">{n.note}</p>
              <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                {String(n.author.display_name ?? 'Someone')} ·{' '}
                {new Date(n.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}
              </p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-[var(--muted)]">No notes yet.</p>}
        </div>
      </div>
    </div>
  )
}