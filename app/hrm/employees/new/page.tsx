import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/hrm/auth'
import { EmployeeForm } from '@/components/hrm/employee-form'

export const metadata = { title: 'Add Employee' }

export default async function NewEmployeePage() {
  const ctx = await getAuthContext()
  if (!ctx) redirect('/auth/login')
  if (!hasPermission(ctx, 'employees.manage')) redirect('/hrm/employees')

  const supabase = await createClient()
  const { data: roles } = await supabase.from('roles').select('slug, name').order('hierarchy_level', { ascending: true })

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        Sierra Electric Technologies — HR
      </p>
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Add employee</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Creates a login account and staff record. The person can sign in right away.
      </p>

      <EmployeeForm
        mode="create"
        submitText="Create employee"
        submitHref="/api/hrm/employees"
        method="POST"
        roles={(roles ?? []).map((r) => ({ slug: r.slug, name: r.name }))}
      />
    </div>
  )
}