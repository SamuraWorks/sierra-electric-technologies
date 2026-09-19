'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Pencil } from 'lucide-react'

export interface ProfileFormData {
  displayName: string
  phone: string
  email: string
  photoUrl: string | null
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none'

export function ProfileForm({ initial }: { initial: ProfileFormData }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [phone, setPhone] = useState(initial.phone)
  const [email, setEmail] = useState(initial.email)
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/hrm/me/avatar', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Upload failed — please try again')
        return
      }
      setPhotoUrl(data.photoUrl as string)
      router.refresh()
    } catch {
      setError('Upload failed — please try again')
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch('/api/hrm/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, phone, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Update failed — please try again')
        return
      }
      setOk('Profile updated successfully.')
      router.refresh()
    } catch {
      setError('Update failed — please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Pencil size={15} className="text-blue-600" /> Personal information
      </h2>

      <div className="mb-5 flex items-center gap-4">
        <div className="relative">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-xl font-semibold text-white">
              {initials}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Change profile picture"
            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow ring-2 ring-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Camera size={14} />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Profile picture</p>
          <p className="text-xs text-slate-400">JPG, PNG or WebP · max 2MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onPickFile}
        />
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Full name</span>
          <input
            required
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Phone</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+232 76 000 0000" className={inputClass} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Work email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">{error}</p>}
        {ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:col-span-2">{ok}</p>}

        <div className="flex justify-end sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}