import { createClient } from '@supabase/supabase-js'
import { requireServiceRoleKey, SUPABASE_URL } from './env'

export function createAdminClient() {
  return createClient(SUPABASE_URL, requireServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}