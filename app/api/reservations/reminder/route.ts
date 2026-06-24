import { NextRequest, NextResponse } from 'next/server'

// Called by pg_cron every hour once Phase 3 WhatsApp is live.
// Finds reservations 24h away and sends reminder messages.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // TODO Phase 3: query reservations where reservation_date = tomorrow,
  // status = confirmed, reminder_sent_at IS NULL → send WhatsApp reminder
  return NextResponse.json({ ok: true, sent: 0 })
}
