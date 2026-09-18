'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Loader2 } from 'lucide-react'

export function NewLeaveForm({ types }: { types: { id: string; name: string; default_days: number }[] }) {
  const router = useRouter()
  const [typeId, setTypeId] = useState(types[0]?.id ?? '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const days =
    startDate && endDate && new Date(endDate) >= new Date(startDate)
      ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1
      : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/hrm/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave_type_id: typeId, start_date: startDate, end_date: endDate, reason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      router.push('/hrm/leave')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
      <label className="mb-5 block">
        <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Leave type</span>
        <select
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-2)] focus:border-[var(--accent)] focus:outline-none"
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.default_days} days/yr)
            </option>
          ))}
        </select>
      </label>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">From</span>
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">To</span>
          <input
            required
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <p className="mb-5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-2)]">
        {days > 0 ? <><Check className="mr-1 inline size-4 text-[var(--accent)]" />{days} day{days === 1 ? '' : 's'} of leave</> : 'Select a date range…'}
      </p>

      <label className="mb-5 block">
        <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Reason</span>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly explain the reason for leave…"
          className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </label>

      {error && (
        <p className="mb-5 rounded-lg border border-[#e0a03b] bg-[#fff8e6] px-4 py-2.5 text-sm text-[#9c6b1f]">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !endDate || !startDate}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Submit request
        </button>
        <Link
          href="/hrm/leave"
          className="rounded-lg border border-[var(--line-2)] px-5 py-2 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}