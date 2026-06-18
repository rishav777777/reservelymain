import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/reservations/tables?date=2026-06-15&time=19:00&duration=90&restaurantId=xxx
//
// Returns all active tables with live status:
//   "free"     → bookable right now
//   "held"     → someone is mid-booking (3-min hold), treat as blocked
//   "reserved" → confirmed or arrived reservation overlaps this slot

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
  const date         = searchParams.get('date')          // YYYY-MM-DD
  const time         = searchParams.get('time')          // HH:MM
  const duration     = parseInt(searchParams.get('duration') ?? '90', 10)
  const restaurantId = searchParams.get('restaurantId')

  if (!date || !time || !restaurantId) {
    return NextResponse.json({ error: 'date, time, restaurantId required' }, { status: 400 })
  }

  const supabase = await createClient()

  // 1. All active tables for this restaurant
  const { data: tables, error: tErr } = await supabase
    .from('restaurant_tables')
    .select('id, name, capacity, category')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('name')

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  // 2. Confirmed/arrived reservations that day
  const { data: confirmedRes } = await supabase
    .from('reservations')
    .select('table_id, reservation_time, duration_minutes')
    .eq('restaurant_id', restaurantId)
    .eq('reservation_date', date)
    .in('status', ['confirmed', 'arrived'])

  // 3. Active (non-expired) holds that day
  const { data: holds } = await supabase
    .from('table_holds')
    .select('table_id, reservation_time, duration_minutes, session_id')
    .eq('restaurant_id', restaurantId)
    .eq('reservation_date', date)
    .gt('held_until', new Date().toISOString())

  // Build blocked sets
  const reservedIds = new Set<string>()
  for (const r of confirmedRes ?? []) {
    if (r.table_id && overlaps(r.reservation_time, r.duration_minutes ?? 90, time, duration)) {
      reservedIds.add(r.table_id)
    }
  }

  const heldMap = new Map<string, string>() // tableId → sessionId
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