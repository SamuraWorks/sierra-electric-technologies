import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Briefcase, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'

export const metadata = { title: 'Employee' }

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'employees.view')) redirect('/hrm/dashboard')

  const supabase = await createClient()

  const [{ data: profile }, { data: userRoles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('user_roles')
      .select('id, is_active, role:roles(name, slug)')
      .eq('user_id', id)
      .eq('is_active', true),
  ])

  if (!profile) notFound()

  const roles = (userRoles ?? [])
    .map((ur) => (Array.isArray(ur.role) ? ur.role[0] : ur.role))
    .filter(Boolean)

  const fields: { label: string; value?: string | null }[] = [
    { label: 'Employee ID', value: profile.employee_id },
    { label: 'Email', value: profile.email },
    { label: 'Phone', value: profile.phone },
    { label: 'Position', value: profile.position },
    { label: 'Department', value: profile.department },
    { label: 'Address', value: profile.address },
    { label: 'Emergency contact', value: profile.emergency_contact },
    { label: 'Gender', value: profile.gender },
    { label: 'Date of birth', value: profile.date_of_birth },
  ]

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/hrm/employees"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        Back to employees
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-[var(--surface-2)] text-lg font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
            {String(profile.display_name ?? '?')
              .split(' ')
              .map((n: string) => n[0])
              .filter(Boolean)
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--text)]">{profile.display_name}</h1>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] text-[var(--muted)]">
              {profile.employee_id ?? 'No ID'}
              {profile.position && (
                <span className="text-[var(--text-2)]">· {profile.position}</span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span
                  key={r.slug}
                  className="rounded-full border border-[rgba(47,154,91,0.35)] bg-[rgba(47,154,91,0.08)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]"
                >
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        {hasPermission(ctx, 'employees.manage') && (
          <Link
            href={`/hrm/employees/${profile.id}/edit`}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            Edit record
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="mb-4 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            <Briefcase className="size-3.5 text-[var(--accent)]" />
            Job details
          </p>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-[var(--muted)]">Position</dt>
              <dd className="text-sm font-semibold text-[var(--text)]">{profile.position ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">Department</dt>
              <dd className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
                <Building2 className="size-3.5 text-[var(--muted)]" />
                {profile.department ?? '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Contact
          </p>
          <dl className="space-y-3">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Mail className="size-3.5" /> Email
              </dt>
              <dd className="text-sm font-semibold text-[var(--text)]">
                {profile.email ? (
                  <a href={`mailto:${profile.email}`} className="text-[var(--accent)]">
                    {profile.email}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Phone className="size-3.5" /> Phone
              </dt>
              <dd className="text-sm font-semibold text-[var(--text)]">{profile.phone ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Records
        </p>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {fields.map(
            (f) =>
              f.value && (
                <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-2">
                  <dt className="text-xs text-[var(--muted)]">{f.label}</dt>
                  <dd className="text-sm text-right font-medium text-[var(--text)]">{f.value}</dd>
                </div>
              ),
          )}
        </dl>
      </div>
    </div>
  )
}