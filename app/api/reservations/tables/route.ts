import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/reservations/tables?date=2026-06-15&time=19:00&duration=90
//
// Returns all active tables for the authenticated user's own restaurant with live status:
//   "free"     → bookable right now
//   "held"     → someone is mid-booking (3-min hold)
//   "reserved" → confirmed or arrived reservation overlaps this slot
//
// restaurantId URL param is IGNORED — always uses the authenticated user's restaurant.

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function overlaps(
  existingTime: string, existingDur: number,
  requestTime: string,  requestDur: number
): boolean {
  const eStart = toMinutes(existingTime)
  const eEnd   = eStart + existingDur
  const rStart = toMinutes(requestTime)
  const rEnd   = rStart + requestDur
  return eStart < rEnd && eEnd > rStart
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date     = searchParams.get('date')
  const time     = searchParams.get('time')
  const duration = parseInt(searchParams.get('duration') ?? '90', 10)

  if (!date || !time) {
    return NextResponse.json({ error: 'date and time required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const restaurantId = profile.restaurant_id
  const admin = getAdmin()

  const [{ data: tables, error: tErr }, { data: confirmedRes }, { data: holds }] =
    await Promise.all([
      admin
        .from('restaurant_tables')
        .select('id, name, capacity, category')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('name'),
      admin
        .from('reservations')
        .select('table_id, reservation_time, duration_minutes')
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', date)
        .in('status', ['confirmed', 'arrived']),
      admin
        .from('table_holds')
        .select('table_id, reservation_time, duration_minutes, session_id')
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', date)
        .gt('held_until', new Date().toISOString()),
    ])

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  const reservedIds = new Set<string>()
  for (const r of confirmedRes ?? []) {
    if (r.table_id && overlaps(r.reservation_time, r.duration_minutes ?? 90, time, duration)) {
      reservedIds.add(r.table_id)
    }
  }

  const heldMap = new Map<string, string>()
  for (const h of holds ?? []) {
    if (overlaps(h.reservation_time, h.duration_minutes ?? 90, time, duration)) {
      heldMap.set(h.table_id, h.session_id)
    }
  }

  const result = (tables ?? []).map(table => ({
    ...table,
    status:        reservedIds.has(table.id) ? 'reserved'
                 : heldMap.has(table.id)     ? 'held'
                 : 'free',
    heldBySession: heldMap.get(table.id) ?? null,
  }))

  return NextResponse.json({ tables: result })
}
