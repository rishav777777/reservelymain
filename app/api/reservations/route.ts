import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logAction } from '@/lib/audit'
import { resourceLimiter, getClientIp } from '@/lib/ratelimit'
import { NextRequest, NextResponse } from 'next/server'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

  // List mode: no `time` param → return reservations for a date (or all dates)
  // Only accessible to authenticated users for their own restaurant.
  if (!time) {
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

    // Ignore any client-supplied restaurantId — always use the authenticated user's own
    const ownRestaurantId = profile.restaurant_id
    const admin = getAdmin()
    let query = admin
      .from('reservations')
      .select('*, restaurant_tables(name, capacity, category)')
      .eq('restaurant_id', ownRestaurantId)
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true })

    if (date) query = query.eq('reservation_date', date)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Table availability mode: requires date + time + restaurantId
  // Uses service-role client so it works for anonymous booking portal guests.
  if (!date || !restaurantId) {
    return NextResponse.json({ error: 'date, time, restaurantId required' }, { status: 400 })
  }

  const admin = getAdmin()

  // 1. All active tables for this restaurant
  const { data: tables, error: tErr } = await admin
    .from('restaurant_tables')
    .select('id, name, capacity, category')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('name')

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  // 2. Confirmed/arrived reservations that day
  const { data: confirmedRes } = await admin
    .from('reservations')
    .select('table_id, reservation_time, duration_minutes')
    .eq('restaurant_id', restaurantId)
    .eq('reservation_date', date)
    .in('status', ['confirmed', 'arrived'])

  // 3. Active (non-expired) holds that day
  const { data: holds } = await admin
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

// POST /api/reservations — create a reservation from the dashboard (staff/manager/owner)
export async function POST(request: NextRequest) {
  const { success: rateOk } = await resourceLimiter.limit(getClientIp(request))
  if (!rateOk) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    guest_name,
    guest_email,
    guest_phone       = null,
    party_size,
    reservation_date,
    reservation_time,
    category          = null,
    special_requests  = null,
    duration_minutes  = 120,
    preferred_table_id = null,
  } = body as {
    guest_name: string
    guest_email: string
    guest_phone?: string | null
    party_size: number
    reservation_date: string
    reservation_time: string
    category?: string | null
    special_requests?: string | null
    duration_minutes?: number
    preferred_table_id?: string | null
  }

  if (!guest_name || !guest_email || !party_size || !reservation_date || !reservation_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 })
  }

  const refBytes = new Uint8Array(5)
  crypto.getRandomValues(refBytes)
  const refCode = 'RSV-' + Array.from(refBytes).map(b => b.toString(36).toUpperCase().padStart(2, '0')).join('').slice(0, 8)

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      restaurant_id:    profile.restaurant_id,
      table_id:         preferred_table_id,
      reference_code:   refCode,
      guest_name:       guest_name.trim(),
      guest_email:      guest_email.trim(),
      guest_phone:      guest_phone?.trim() || null,
      party_size,
      reservation_date,
      reservation_time,
      category,
      special_requests: special_requests?.trim() || null,
      duration_minutes,
      status:           'pending',
      source:           'dashboard',
    })
    .select('*, restaurant_tables(name, capacity, category)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAction({
    restaurant_id: profile.restaurant_id,
    actor_id:      user.id,
    actor_name:    profile.full_name ?? null,
    action:        'reservation.created',
    target_type:   'reservation',
    target_id:     reservation.id,
    metadata: { reference_code: refCode, guest_name: guest_name.trim(), party_size },
  }).catch(() => {})

  return NextResponse.json(reservation, { status: 201 })
}

