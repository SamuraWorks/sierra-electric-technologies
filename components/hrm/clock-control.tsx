'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogIn, LogOut } from 'lucide-react'

export function ClockControl({
  todayClockIn,
  todayClockOut,
  todayNote,
  compact = false,
}: {
  todayClockIn: string | null
  todayClockOut: string | null
  todayNote?: string | null
  compact?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const clockedIn = !!todayClockIn
  const clockedOut = !!todayClockOut
  const canAct = !clockedIn || (clockedIn && !clockedOut)

  async function act(action: 'clock-in' | 'clock-out') {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/hrm/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
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
    <div className={compact ? 'h-full rounded-2xl border border-slate-200 bg-white p-5' : 'rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6'}>
      <div className={compact ? '' : 'rounded-[var(--r-md)]'}>
        <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Today</p>
        <p className="mb-3 text-sm text-[var(--muted)]">
          {clockedIn ? (
            <>
              Clocked in at{' '}
              <span className="font-semibold text-[var(--text)]">
                {new Date(todayClockIn!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {clockedOut && (
                <>
                  {' · '}out at{' '}
                  <span className="font-semibold text-[var(--text)]">
                    {new Date(todayClockOut!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
            </>
          ) : (
            'You have not clocked in yet.'
          )}
          {clockedIn && todayNote && (
            <span className="mt-0.5 block text-xs text-[var(--muted)]">
              Note: <span className="text-[var(--text-2)]">{todayNote}</span>
            </span>
          )}
        </p>
        {canAct && (
          <label className="mb-3 block">
            <span className="text-xs font-semibold text-[var(--text-2)]">Note (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="e.g. Working on site, left for appointment…"
              className="mt-1 w-full rounded-lg border border-[var(--line-2)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
          </label>
        )}
        <div className="flex items-center gap-3">
          {!clockedIn && (
            <button
              onClick={() => act('clock-in')}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Clock in
            </button>
          )}
          {clockedIn && !clockedOut && (
            <button
              onClick={() => act('clock-out')}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--line-2)] px-5 py-2 text-sm font-bold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              Clock out
            </button>
          )}
          {clockedIn && clockedOut && (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
              Day complete
            </span>
          )}
        </div>
        {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
      </div>
    </div>
  )
}