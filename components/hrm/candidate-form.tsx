'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Employee referral' },
  { value: 'job-board', label: 'Job board' },
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'media', label: 'Media / advert' },
  { value: 'other', label: 'Other' },
]

export function NewCandidateForm() {
  const router = useRouter()
  const [form, setForm] = useState({ display_name: '', email: '', phone: '', position_applied: '', source: 'website' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/hrm/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      router.push(`/hrm/candidates/${data.id}`)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Full name *</span>
          <input required value={form.display_name} onChange={set('display_name')} placeholder="e.g. Abdul Kargbo" className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Email *</span>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Phone</span>
          <input value={form.phone} onChange={set('phone')} placeholder="232 76 000 000" className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Position applied for</span>
          <input value={form.position_applied} onChange={set('position_applied')} placeholder="e.g. Electrical Engineer" className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Source</span>
          <select value={form.source} onChange={set('source')} className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-2)] focus:border-[var(--accent)] focus:outline-none">
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-5 rounded-lg border border-[#e0a03b] bg-[#fff8e6] px-4 py-2.5 text-sm text-[#9c6b1f]">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Add candidate
        </button>
        <Link href="/hrm/candidates" className="rounded-lg border border-[var(--line-2)] px-5 py-2 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
          Cancel
        </Link>
      </div>
    </form>
  )
}