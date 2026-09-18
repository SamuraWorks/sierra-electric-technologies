'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

export interface QuickField {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'datetime-local'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  full?: boolean
  defaultValue?: string
}

export function QuickForm({
  endpoint,
  fields,
  submitLabel = 'Save',
  title,
  collapsible = true,
}: {
  endpoint: string
  fields: QuickField[]
  submitLabel?: string
  title?: string
  collapsible?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(!collapsible)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setOk(null)
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
        return
      }
      form.reset()
      setOk('Saved successfully.')
      router.refresh()
      if (collapsible) setOpen(false)
    } catch {
      setError('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  if (collapsible && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <Plus size={15} /> {title ?? submitLabel}
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title ?? submitLabel}</h2>
        {collapsible && (
          <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </span>
            {f.type === 'textarea' ? (
              <textarea
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                defaultValue={f.defaultValue}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            ) : f.type === 'select' ? (
              <select
                name={f.name}
                required={f.required}
                defaultValue={f.defaultValue}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none"
              >
                <option value="">— Select —</option>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={f.name}
                type={f.type ?? 'text'}
                required={f.required}
                placeholder={f.placeholder}
                defaultValue={f.defaultValue}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            )}
          </label>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {ok && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}