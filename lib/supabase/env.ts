// Default project settings for Sierra Electric HRM.
// The URL and the pub. (anon/publishable) key are PUBLIC by design — they are
// safe to ship in the bundle, so the app works even when the hosting platform
// (e.g. Vercel) is missing the NEXT_PUBLIC_* variables. Override them with
// real env vars when you want to point at a different Supabase project.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  'https://xuylnqwnbdewehlglsty.supabase.co'

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eWxucXduYmRld2VobGdsc3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzIxOTQsImV4cCI6MjEwNTMwODE5NH0.bQWDmW3s06xByYPCbo-uKLR2asWwK5n5NtGCjfMAp64'

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export function requireServiceRoleKey(): string {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it as an environment variable on your hosting platform.',
    )
  }
  return SUPABASE_SERVICE_ROLE_KEY
}