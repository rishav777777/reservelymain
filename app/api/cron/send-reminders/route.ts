import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { sendReminderEmail } from '@/lib/services/email'
import { NextRequest, NextResponse } from 'next/server'

// Vercel cron hits this endpoint; guard with a shared secret.
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()

  // ── 24-hour reminders ──────────────────────────────────────────────────────
  // Target: reservations whose date is tomorrow, status confirmed, not yet sent
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const { data: upcoming24h } = await admin
    .from('reservations')
    .select('*, restaurant_tables(name, capacity, category)')
    .eq('reservation_date', tomorrowStr)
    .eq('status', 'confirmed')
    .eq('reminder_24h_sent', false)

  let sent24h = 0
  for (const r of upcoming24h ?? []) {
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('name')
      .eq('id', r.restaurant_id)
      .single()

    if (!restaurant) continue

    await sendReminderEmail(r, restaurant.name, '24h').catch(() => {})

    await admin
      .from('reservations')
      .update({ reminder_24h_sent: true })
      .eq('id', r.id)

    sent24h++
  }

  // ── 2-hour reminders ───────────────────────────────────────────────────────
  // Crons run hourly. Window = [now+1.75h, now+2.75h] (60-min span) so every
  // reservation is covered by exactly one cron run. reminder_2h_sent prevents
  // duplicates if two runs overlap on the same reservation.
  const windowStart = new Date(now.getTime() + 1.75 * 60 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 2.75 * 60 * 60 * 1000)

  const todayStr = now.toISOString().slice(0, 10)
  const windowStartTime = windowStart.toTimeString().slice(0, 5) // HH:MM
  const windowEndTime   = windowEnd.toTimeString().slice(0, 5)

  const { data: upcoming2h } = await admin
    .from('reservations')
    .select('*, restaurant_tables(name, capacity, category)')
    .eq('reservation_date', todayStr)
    .eq('status', 'confirmed')
    .eq('reminder_2h_sent', false)
    .gte('reservation_time', windowStartTime)
    .lte('reservation_time', windowEndTime)

  let sent2h = 0
  for (const r of upcoming2h ?? []) {
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('name')
      .eq('id', r.restaurant_id)
      .single()

    if (!restaurant) continue

    await sendReminderEmail(r, restaurant.name, '2h').catch(() => {})

    await admin
      .from('reservations')
      .update({ reminder_2h_sent: true })
      .eq('id', r.id)

    sent2h++
  }

  return NextResponse.json({ ok: true, sent24h, sent2h })
}
