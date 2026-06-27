import { getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

// Called daily by Vercel Cron (see vercel.json).
// Deletes email_log rows older than 90 days — GDPR storage limitation compliance.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin  = getAdminClient()
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await admin
    .from('email_logs')
    .delete()
    .lt('created_at', cutoff)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, cutoff, purged_before: cutoff })
}
