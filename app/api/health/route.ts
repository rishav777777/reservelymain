import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const CRITICAL_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'PADDLE_API_KEY',
  'CRON_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

function isValidUrl(s: string) {
  try { new URL(s); return true } catch { return false }
}

function formatErrors(): string[] {
  const errs: string[] = []
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && !isValidUrl(appUrl))
    errs.push('NEXT_PUBLIC_APP_URL is not a valid URL')
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && !resendKey.startsWith('re_'))
    errs.push('RESEND_API_KEY format invalid (expected prefix: re_)')
  const paddleKey = process.env.PADDLE_API_KEY
  if (paddleKey && !paddleKey.startsWith('test_') && !paddleKey.startsWith('live_') && !paddleKey.startsWith('pdl_'))
    errs.push('PADDLE_API_KEY format invalid (expected prefix: test_ / live_ / pdl_)')
  return errs
}

// GET /api/health
// Uptime-monitor / load-balancer probe.
// Checks DB connectivity and critical env vars — returns 200 when healthy, 503 when not.
export async function GET() {
  const start = Date.now()

  const missingVars  = CRITICAL_VARS.filter(v => !process.env[v])
  const formatIssues = formatErrors()

  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Lightweight ping — count one row from a small table
    const { error } = await admin
      .from('platform_settings')
      .select('key')
      .limit(1)

    if (error) throw error

    const degraded = missingVars.length > 0 || formatIssues.length > 0
    if (degraded) {
      return NextResponse.json(
        {
          status:        'degraded',
          db:            'connected',
          missing_vars:  missingVars.length  > 0 ? missingVars  : undefined,
          format_errors: formatIssues.length > 0 ? formatIssues : undefined,
          latency:       `${Date.now() - start}ms`,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status:  'ok',
      db:      'connected',
      latency: `${Date.now() - start}ms`,
    })
  } catch (err) {
    return NextResponse.json(
      {
        status:        'error',
        db:            'unreachable',
        missing_vars:  missingVars.length > 0 ? missingVars : undefined,
        message:       err instanceof Error ? err.message : 'Unknown error',
        latency:       `${Date.now() - start}ms`,
      },
      { status: 503 }
    )
  }
}
