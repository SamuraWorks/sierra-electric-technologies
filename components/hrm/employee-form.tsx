'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export interface EmployeeFormData {
  display_name: string
  email: string
  employee_id: string
  position: string
  department: string
  phone: string
  address: string
  role_slug?: string
}

interface EmployeeFormProps {
  mode: 'create' | 'edit'
  submitText: string
  initial?: EmployeeFormData
  roles: { slug: string; name: string }[]
  submitHref: string
  method: 'POST' | 'PATCH'
}

export function EmployeeForm({ mode, submitText, initial, roles, submitHref, method }: EmployeeFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<EmployeeFormData>(
    initial ?? {
      display_name: '',
      email: '',
      employee_id: '',
      position: '',
      department: '',
      phone: '',
      address: '',
      role_slug: roles[0]?.slug ?? '',
    },
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field: keyof EmployeeFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch(submitHref, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          password: password || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      router.push(data.id ? `/hrm/employees/${data.id}` : '/hrm/employees')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid max-w-3xl gap-5 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Full name *</span>
          <input
            required
            value={form.display_name}
            onChange={set('display_name')}
            placeholder="e.g. Aminata Bangura"
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Work email *</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={set('email')}
            disabled={mode === 'edit'}
            placeholder="name@sierraelectric.sl"
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Employee ID</span>
          <input
            value={form.employee_id}
            onChange={set('employee_id')}
            placeholder="SET-0021"
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Position</span>
          <input
            value={form.position}
            onChange={set('position')}
            placeholder="e.g. Electrical Engineer"
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Department</span>
          <input
            value={form.department}
            onChange={set('department')}
            placeholder="e.g. Engineering"
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Phone</span>
          <input
            value={form.phone}
            onChange={set('phone')}
            placeholder="232 76 000 000"
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Address</span>
          <input
            value={form.address}
            onChange={set('address')}
            placeholder="Street, Freetown, Sierra Leone"
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">System role</span>
          <select
            value={form.role_slug ?? ''}
            onChange={set('role_slug')}
            className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-2)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">— No role —</option>
            {roles.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        {mode === 'create' && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">Temporary password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Demo@1234"
              className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
            <span className="mt-1 block text-[11px] text-[var(--muted)]">Defaults to the demo password.</span>
          </label>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-[#e0a03b] bg-[#fff8e6] px-4 py-2.5 text-sm text-[#9c6b1f]">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {submitText}
        </button>
        <Link
          href="/hrm/employees"
          className="rounded-lg border border-[var(--line-2)] px-5 py-2 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}