import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { EmployeeForm } from '@/components/hrm/employee-form'

export const metadata = { title: 'Edit Employee' }

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'employees.manage')) redirect('/hrm/employees')

  const supabase = await createClient()

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('roles').select('slug, name').order('hierarchy_level', { ascending: true }),
  ])

  if (!profile) notFound()

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href={`/hrm/employees/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        Back to {profile.display_name}
      </Link>

      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        Sierra Electric Technologies — HR
      </p>
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Edit {profile.display_name}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {profile.employee_id ?? 'No employee ID'} {profile.position && `· ${profile.position}`}
      </p>

      <EmployeeForm
        mode="edit"
        submitText="Save changes"
        submitHref={`/api/hrm/employees/${id}`}
        method="PATCH"
        roles={(roles ?? []).map((r) => ({ slug: r.slug, name: r.name }))}
        initial={{
          display_name: profile.display_name ?? '',
          email: profile.email ?? '',
          employee_id: profile.employee_id ?? '',
          position: profile.position ?? '',
          department: profile.department ?? '',
          phone: profile.phone ?? '',
          address: profile.address ?? '',
        }}
      />
    </div>
  )
}