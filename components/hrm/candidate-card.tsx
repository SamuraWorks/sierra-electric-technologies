'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SOURCE_LABEL: Record<string, string> = {
  website: 'Website',
  referral: 'Referral',
  'job-board': 'Job board',
  'walk-in': 'Walk-in',
  media: 'Media',
  other: 'Other',
}

export function CandidateCard({
  id,
  displayName,
  email,
  position,
  source,
  canManage,
}: {
  id: string
  displayName: string
  email: string
  position: string | null
  source: string
  canManage: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setStatus(status: string) {
    setBusy(true)
    try {
      await fetch(`/api/hrm/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const initials = String(displayName)
    .split(' ')
    .map((n: string) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 transition-shadow hover:shadow-[var(--sh-sm)]">
      <Link href={`/hrm/candidates/${id}`} className="block">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-[10px] font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-[var(--text)]">{displayName}</span>
            <span className="block truncate text-[11px] text-[var(--muted)]">{position ?? '—'}</span>
          </span>
        </div>
      </Link>
      <p className="mt-2 truncate text-[11px] text-[var(--muted)]">
        {SOURCE_LABEL[source] ?? source} · {email}
      </p>
      {canManage && (
        <select
          disabled={busy}
          defaultValue="__move__"
          onChange={(e) => {
            if (e.target.value && e.target.value !== '__move__') setStatus(e.target.value)
            e.target.value = '__move__'
          }}
          className="mt-2.5 w-full rounded-md border border-[var(--line-2)] bg-[var(--surface-2)] px-2 py-1 text-[11px] text-[var(--text-2)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
        >
          <option value="__move__" disabled>
            Move to…
          </option>
          <option value="new">New</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interviewed">Interviewed</option>
          <option value="offered">Offered</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      )}
    </div>
  )
}