import { NextRequest } from 'next/server'
import { jsonOk, jsonError, requirePermission, logAuditAction } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Permission } from '@/lib/hrm/permissions'

// Whitelist of creatable records: route key -> table + required permission + fields.
const REGISTRY: Record<
  string,
  { table: string; permission: Permission; fields: string[]; slugFrom?: string; numeric?: string[]; boolean?: string[] }
> = {
  departments: {
    table: 'departments',
    permission: 'departments.manage',
    fields: ['name', 'description', 'head_id'],
    slugFrom: 'name',
  },
  positions: {
    table: 'positions',
    permission: 'positions.manage',
    fields: ['name', 'description', 'responsibilities', 'department_id'],
    slugFrom: 'name',
  },
  projects: {
    table: 'projects',
    permission: 'projects.manage',
    fields: ['name', 'description', 'lead_id', 'department_id', 'status', 'priority', 'start_date', 'target_date', 'progress'],
    numeric: ['progress'],
  },
  tasks: {
    table: 'tasks',
    permission: 'tasks.manage',
    fields: ['title', 'description', 'project_id', 'assignee_id', 'status', 'priority', 'due_date'],
  },
  'work-reports': {
    table: 'work_reports',
    permission: 'work_reports.view',
    fields: ['project_id', 'report_date', 'work_completed', 'challenges', 'next_steps'],
  },
  payments: {
    table: 'payments',
    permission: 'payments.manage',
    fields: ['recipient_id', 'amount', 'period_label', 'paid_on', 'method', 'reference', 'confirmation_status'],
    numeric: ['amount'],
  },
  announcements: {
    table: 'announcements',
    permission: 'announcements.create',
    fields: ['title', 'body', 'audience', 'priority', 'is_pinned', 'published_at'],
    boolean: ['is_pinned'],
  },
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params
  const config = REGISTRY[table]
  if (!config) return jsonError('Unknown record type', 404)

  const result = await requirePermission(config.permission)
  if ('error' in result) return result.error

  const { ctx } = result
  const body = await request.json().catch(() => ({}))

  const row: Record<string, unknown> = {}
  for (const field of config.fields) {
    const raw = (body as Record<string, unknown>)[field]
    if (raw === undefined) continue
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      row[field] = trimmed === '' ? null : trimmed
    } else {
      row[field] = raw
    }
    if (config.numeric?.includes(field) && row[field] != null) {
      const n = Number(row[field])
      if (Number.isNaN(n)) return jsonError(`${field} must be a number`)
      row[field] = n
    }
    if (config.boolean?.includes(field) && row[field] != null) {
      row[field] = row[field] === true || row[field] === 'true'
    }
  }

  if (config.slugFrom) {
    const source = String(row[config.slugFrom] ?? '').trim()
    if (!source) return jsonError(`${config.slugFrom} is required`)
    row.slug = slugify(source)
  }

  // Work reports can be submitted by any staff member for themselves.
  if (table === 'work-reports') {
    row.profile_id = ctx.userId
    if (!row.report_date) row.report_date = new Date().toISOString().slice(0, 10)
  }

  if (table === 'announcements') {
    row.created_by = ctx.userId
    if (!row.published_at) row.published_at = new Date().toISOString()
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from(config.table).insert(row).select('id').single()
  if (error) return jsonError(error.message, 400)

  await logAuditAction(result.supabase, `${table}.create`, config.table, data?.id ?? null, null, row)

  return jsonOk({ success: true, id: data?.id ?? null })
}