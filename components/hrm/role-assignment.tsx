'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X } from 'lucide-react'

interface RoleOption {
  id: string
  name: string
  slug: string
}

export function RoleAssignment({
  userId,
  assignedRoles,
  allRoles,
  canAssign,
  canRemove,
}: {
  userId: string
  assignedRoles: RoleOption[]
  allRoles: RoleOption[]
  canAssign: boolean
  canRemove: boolean
}) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const unassigned = allRoles.filter((r) => !assignedRoles.some((a) => a.slug === r.slug))

  async function assign() {
    if (!slug) return
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/hrm/roles/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role_slug: slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to assign role.')
        return
      }
      setSlug('')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(roleSlug: string) {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/hrm/roles/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role_slug: roleSlug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to remove role.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {assignedRoles.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(47,154,91,0.35)] bg-[rgba(47,154,91,0.08)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]"
          >
            {r.name}
            {canRemove && (
              <button
                onClick={() => remove(r.slug)}
                disabled={busy}
                aria-label={`Remove ${r.name}`}
                className="rounded-full p-0.5 transition-colors hover:bg-[rgba(47,154,91,0.2)] disabled:opacity-50"
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
        {assignedRoles.length === 0 && (
          <span className="rounded-full border border-[#e0a03b] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9c6b1f]">
            No role — assign one
          </span>
        )}
      </div>

      {canAssign && unassigned.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-2)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Assign a role…</option>
            {unassigned.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <button
            onClick={assign}
            disabled={busy || !slug}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
            Assign
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  )
}