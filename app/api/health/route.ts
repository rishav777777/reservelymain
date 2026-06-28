import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/health
// Uptime-monitor / load-balancer probe.
// Checks DB connectivity — returns 200 when healthy, 503 when not.
export async function GET() {
  const start = Date.now()

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

    return NextResponse.json({
      status:  'ok',
      db:      'connected',
      latency: `${Date.now() - start}ms`,
    })
  } catch (err) {
    return NextResponse.json(
      {
        status:  'error',
        db:      'unreachable',
        message: err instanceof Error ? err.message : 'Unknown error',
        latency: `${Date.now() - start}ms`,
      },
      { status: 503 }
    )
  }
}
