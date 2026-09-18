import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'

export async function POST(request: NextRequest) {
  const result = await requirePermission('payroll.run')
  if ('error' in result) return result.error

  const { supabase, ctx } = result

  const now = new Date()
  const month = now.toISOString().slice(0, 7)
  const label = now.toLocaleDateString([], { month: 'long', year: 'numeric' })

  const { data: existingRun } = await supabase.from('payroll_runs').select('id').eq('month', month).maybeSingle()
  if (existingRun) {
    return jsonError('A payroll run for this month already exists', 409)
  }

  const { data: salaryRows } = await supabase
    .from('salary_configs')
    .select('user_id, gross_salary, currency')

  if (!salaryRows || salaryRows.length === 0) {
    return jsonError('No salary configurations found — add salaries first', 400)
  }

  const { data: run, error: runError } = await supabase
    .from('payroll_runs')
    .insert({ month, label, status: 'processed', created_by: ctx.userId })
    .select('id')
    .single()

  if (runError || !run) return jsonError(runError?.message ?? 'Failed to create payroll run', 500)

  const entries = salaryRows.map((s) => {
    const gross = Number(s.gross_salary ?? 0)
    const deduction = s.currency === 'SLL' ? Math.round(gross * 0.05 * 100) / 100 : 0
    return {
      run_id: run.id,
      user_id: s.user_id,
      gross_salary: gross,
      deductions: deduction,
      net_salary: gross - deduction,
      currency: s.currency ?? 'SLL',
    }
  })

  const { error: entriesError } = await supabase.from('payroll_entries').insert(entries)
  if (entriesError) return jsonError(entriesError.message, 500)

  await logAuditAction(supabase, 'payroll.run', 'payroll_run', run.id, null, {
    month,
    entries: entries.length,
  })

  return jsonOk({ success: true, month, entries: entries.length }, 201)
}