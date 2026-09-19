import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isNetworkError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('fetch failed') ||
    m.includes('econnrefused') ||
    m.includes('econnreset') ||
    m.includes('timeout') ||
    m.includes('aborted') ||
    m.includes('enotfound') ||
    m.includes('network') ||
    m.includes('failed to fetch')
  )
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const MAX_ATTEMPTS = 3
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let result: { error: { message: string } | null }
    try {
      const supabase = await createClient()
      result = await supabase.auth.signInWithPassword({ email, password })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown error'
      if (isNetworkError(message) && attempt < MAX_ATTEMPTS - 1) {
        await sleep(800 * (attempt + 1))
        continue
      }
      if (isNetworkError(message)) {
        return NextResponse.json(
          { error: 'Network error. Please check your connection and try again.' },
          { status: 502 },
        )
      }
      return NextResponse.json(
        { error: `Sign-in service error: ${message}` },
        { status: 500 },
      )
    }

    if (result.error) {
      if (isNetworkError(result.error.message)) {
        if (attempt < MAX_ATTEMPTS - 1) {
          await sleep(800 * (attempt + 1))
          continue
        }
        return NextResponse.json(
          { error: 'Network error. Please check your connection and try again.' },
          { status: 502 },
        )
      }

      const message =
        result.error.message.toLowerCase().includes('confirm') ||
        result.error.message.toLowerCase().includes('email not confirmed')
          ? 'Please confirm your email before signing in.'
          : 'Invalid email or password.'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { error: 'Network error. Please check your connection and try again.' },
    { status: 502 },
  )
}