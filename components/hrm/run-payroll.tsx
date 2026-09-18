'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'

export function RunPayrollButton({ currentMonthExists }: { currentMonthExists: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/hrm/payroll/run', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
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
    <div className="text-right">
      <button
        onClick={run}
        disabled={busy || currentMonthExists}
        title={currentMonthExists ? 'A run already exists for this month' : 'Generate payroll entries for this month'}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)] shadow-sm transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        {currentMonthExists ? 'This month ran' : 'Run this month'}
      </button>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  )
}