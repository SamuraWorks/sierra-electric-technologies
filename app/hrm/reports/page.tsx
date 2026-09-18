import { ModulePlaceholder } from '@/components/hrm/module-placeholder'

export const metadata = { title: 'Reports' }

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="Attendance, payroll, leave and recruitment analytics with CSV export."
    />
  )
}