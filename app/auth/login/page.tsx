'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const next = '/hrm/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Invalid email or password.')
        setBusy(false)
        return
      }
      router.replace(next)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--line-accent)] focus:ring-2 focus:ring-[rgba(47,154,91,0.15)]'

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-5 py-12">
      <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-[rgba(47,154,91,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-[rgba(47,154,91,0.08)] blur-3xl" />

      <div className="relative w-full max-w-md rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface)] p-7 shadow-[var(--sh-md)] sm:p-10">
        <Link href="/" className="flex items-center justify-center gap-3">
          <span className="grid size-12 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] font-display text-sm font-bold text-[var(--accent-ink)]">
            SET
          </span>
          <span className="flex flex-col font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Sierra Electric Technologies
            <b className="normal-case tracking-[0.04em] text-[var(--text)]">HR Portal</b>
          </span>
        </Link>

        <h1 className="mt-8 text-center font-display text-3xl font-semibold text-[var(--text)]">
          Welcome back.
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Sign in to your staff portal.
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--text-2)]">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sierraelectric.sl"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--text-2)]">
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </label>
          {error && (
            <p role="alert" className="text-center text-sm text-[#b3402a]">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-[var(--accent-ink)] transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {busy ? 'Signing in…' : 'Sign in'}
            {!busy && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-[var(--muted)]">
          Staff only. <Link href="/" className="font-semibold text-[var(--accent)]">Back to website</Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 py-12">
          <div className="w-full max-w-md rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface)] p-7 sm:p-10">
            <div className="h-6 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
            <div className="mt-10 h-10 w-48 animate-pulse rounded bg-[var(--surface-2)]" />
            <div className="mt-8 space-y-5">
              <div className="h-11 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              <div className="h-11 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              <div className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
            </div>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}