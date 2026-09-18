import { ModulePlaceholder } from '@/components/hrm/module-placeholder'

export const metadata = { title: 'Audit Log' }

export default function AuditPage() {
  return (
    <ModulePlaceholder
      title="Audit Log"
      description="Read-only trail of role changes, payroll runs and sensitive actions."
    />
  )
}