import { redirect } from 'next/navigation'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { NewCandidateForm } from '@/components/hrm/candidate-form'

export const metadata = { title: 'New Candidate' }

export default async function NewCandidatePage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'candidates.review')) redirect('/hrm/candidates')

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        Sierra Electric Technologies — Recruitment
      </p>
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Add candidate</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Add an applicant to the recruitment pipeline.
      </p>
      <NewCandidateForm />
    </div>
  )
}