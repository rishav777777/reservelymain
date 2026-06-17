import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const HOLD_MINUTES = 3

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reservations/hold
// Places a 3-minute hold on a table for the given session.
// Calling again with the same tableId + sessionId renews the hold (heartbeat).
// Returns { ok, heldUntil } or 409 { error, conflict: true } if taken.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { tableId, date, time, duration = 90, sessionId, restaurantId } = body as {
    tableId: string
    date: string
    time: string
    duration?: number
    sessionId: string
    restaurantId: string
  }

  if (!tableId || !date || !time || !sessionId || !restaurantId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  // Check for a non-expired hold by a DIFFERENT session
  const { data: existing } = await supabase
    .from('table_holds')
    .select('id, session_id, held_until')
    .eq('restaurant_id', restaurantId)
    .eq('table_id', tableId)
    .eq('reservation_date', date)
    .eq('reservation_time', time)
    .gt('held_until', new Date().toISOString())
    .maybeSingle()

  if (existing && existing.session_id !== sessionId) {
    return NextResponse.json(
      { error: 'Table just got taken by another user', conflict: true },
      { status: 409 }
    )
  }

  // Check for overlapping confirmed reservations
  const rStart = toMinutes(time)
  const rEnd   = rStart + duration

  const { data: conflicts } = await supabase
    .from('reservations')
    .select('id, reservation_time, duration_minutes')
    .eq('restaurant_id', restaurantId)
    .eq('reservation_date', date)
    .eq('table_id', tableId)
    .in('status', ['confirmed', 'arrived'])

  for (const r of conflicts ?? []) {
    const eStart = toMinutes(r.reservation_time)
    const eEnd   = eStart + (r.duration_minutes ?? 90)
    if (rStart < eEnd && rEnd > eStart) {
      return NextResponse.json(
        { error: 'Table already confirmed for this slot', conflict: true },
        { status: 409 }
      )
    }
  }

  // Upsert: create new hold or renew existing one for this session
  const heldUntil = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('table_holds')
    .upsert(
      {
        restaurant_id:    restaurantId,
        table_id:         tableId,
        reservation_date: date,
        reservation_time: time,
        duration_minutes: duration,
        held_until:       heldUntil,
        session_id:       sessionId,
      },
      { onConflict: 'restaurant_id,table_id,reservation_date,reservation_time' }
    )

  if (error) {
    // 23505 = unique violation from race condition
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Table just got taken', conflict: true },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, heldUntil })
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reservations/hold
// Releases the hold when user picks a different table or navigates back.
// Only deletes OUR session's hold — never another user's.
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { tableId, date, time, sessionId, restaurantId } = body as {
    tableId: string
    date: string
    time: string
    sessionId: string
    restaurantId: string
  }

  if (!tableId || !date || !time || !sessionId || !restaurantId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  await supabase
    .from('table_holds')
    .delete()
    .eq('restaurant_id', restaurantId)
    .eq('table_id', tableId)
    .eq('reservation_date', date)
    .eq('reservation_time', time)
    .eq('session_id', sessionId) // safety: only delete OUR hold

  return NextResponse.json({ ok: true })
}