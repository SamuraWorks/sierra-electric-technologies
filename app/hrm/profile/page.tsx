import { redirect } from 'next/navigation'
import { UserRound, BadgeCheck, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/hrm/auth'
import { ChangePassword } from '@/components/hrm/change-password'
import { ProfileForm } from '@/components/hrm/profile-form'

export const metadata = { title: 'My Profile' }

const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default async function ProfilePage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')

  const supabase = await createClient()
  const profile = (ctx.profile ?? {}) as Record<string, unknown>

  const [{ data: positionRows }, { data: activityRows }] = await Promise.all([
    supabase
      .from('profile_positions')
      .select('position:position_id(name, department:department_id(name))')
      .eq('profile_id', ctx.userId),
    supabase
      .from('audit_logs')
      .select('action, target_type, created_at')
      .eq('actor_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const positions = ((positionRows ?? []) as Record<string, unknown>[]).map((p) => {
    const pos = Array.isArray(p.position) ? p.position[0] : p.position
    const dept = pos ? (Array.isArray((pos as Record<string, unknown>).department) ? ((pos as Record<string, unknown>).department as unknown[])[0] : (pos as Record<string, unknown>).department) : null
    return {
      name: pos ? String((pos as Record<string, unknown>).name ?? '') : '',
      department: dept ? String((dept as Record<string, unknown>).name ?? '') : null,
    }
  })

  const name = String(profile.display_name ?? 'User')
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  const roleNames = ctx.roles.map((r) => r.role?.name).filter(Boolean) as string[]
  const activity = ((activityRows ?? []) as Record<string, unknown>[]).map((a) => ({
    action: String(a.action ?? ''),
    targetType: String(a.target_type ?? ''),
    createdAt: a.created_at ? String(a.created_at) : null,
  }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-blue-600">
          <UserRound size={13} /> Sierra Electric — Account
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-900">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Your personal and work information.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-5">
          {profile.photo_url ? (
            <img
              src={String(profile.photo_url)}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 font-display text-xl font-semibold text-white">
              {initials}
            </span>
          )}
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-900">{name}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {positions.length > 0 ? positions.map((p) => p.name).join(' · ') : profile.position ? String(profile.position) : '—'}
            </p>
            {roleNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roleNames.map((r) => (
                  <span key={r} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ProfileForm
            initial={{
              displayName: name,
              phone: profile.phone ? String(profile.phone) : '',
              email: profile.email ? String(profile.email) : '',
              photoUrl: profile.photo_url ? String(profile.photo_url) : null,
            }}
          />

          <ChangePassword />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Positions held</h2>
            {positions.length === 0 ? (
              <p className="text-sm text-slate-400">No positions assigned.</p>
            ) : (
              <ul className="space-y-3">
                {positions.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <BadgeCheck size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.department ?? 'Sierra Electric'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Recent account activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Activity size={15} className="mt-0.5 flex-shrink-0 text-slate-300" />
                    <div>
                      <p className="text-sm text-slate-700">{a.action}</p>
                      <p className="text-xs text-slate-400">
                        {a.targetType} · {fmtDateTime(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}