'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function CandidateStatusControl({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch(`/api/hrm/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: note || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save.')
        return
      }
      setNote('')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-2)] focus:border-[var(--accent)] focus:outline-none"
      >
        <option value="new">New</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="interviewed">Interviewed</option>
        <option value="offered">Offered</option>
        <option value="hired">Hired</option>
        <option value="rejected">Rejected</option>
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add an internal note…"
        className="min-w-0 flex-1 rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
      />
      <button
        onClick={save}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        Save
      </button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  )
}