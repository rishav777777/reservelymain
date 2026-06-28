import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resourceLimiter, manageLookupLimiter, getClientIp } from '@/lib/ratelimit'

interface Ctx {
  params: Promise<{ slug: string }>
}

// GET /api/book/[slug]/manage?ref=RSV-XXXXXXXX
// Returns reservation details for the guest self-service portal.
export async function GET(request: NextRequest, { params }: Ctx) {
  const { success } = await manageLookupLimiter.limit(getClientIp(request)).catch(() => ({ success: true }))
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const { slug } = await params
  const ref = request.nextUrl.searchParams.get('ref')?.toUpperCase()

  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name, booking_enabled')
    .eq('slug', slug)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: reservation } = await admin
    .from('reservations')
    .select('id, reference_code, guest_name, guest_email, party_size, reservation_date, reservation_time, status, notes, duration_minutes, restaurant_tables(name)')
    .eq('restaurant_id', restaurant.id)
    .eq('reference_code', ref)
    .single()

  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

  return NextResponse.json({ reservation, restaurantName: restaurant.name })
}

// PATCH /api/book/[slug]/manage?ref=RSV-XXXXXXXX
// Body: { action: 'cancel' } | { action: 'update', notes: string }
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { success: rateOk } = await resourceLimiter.limit(getClientIp(request))
  if (!rateOk) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { slug } = await params
  const ref = request.nextUrl.searchParams.get('ref')?.toUpperCase()

  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: reservation } = await admin
    .from('reservations')
    .select('id, status, reservation_date, reservation_time, guest_email')
    .eq('restaurant_id', restaurant.id)
    .eq('reference_code', ref)
    .single()

  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

  // Cannot modify completed, cancelled, or no-show reservations
  if (['completed', 'cancelled', 'no_show', 'rejected'].includes(reservation.status)) {
    return NextResponse.json({ error: 'This reservation can no longer be modified' }, { status: 409 })
  }

  // Cannot cancel a reservation in the past
  const resDatetime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
  if (resDatetime < new Date()) {
    return NextResponse.json({ error: 'Cannot modify a past reservation' }, { status: 409 })
  }

  const body = await request.json() as { action: 'cancel' | 'update'; notes?: string }

  if (body.action === 'cancel') {
    await admin
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservation.id)

    return NextResponse.json({ ok: true, action: 'cancelled' })
  }

  if (body.action === 'update') {
    const updates: Record<string, unknown> = {}
    if (typeof body.notes === 'string') updates.notes = body.notes.trim().slice(0, 1000) || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    await admin
      .from('reservations')
      .update(updates)
      .eq('id', reservation.id)

    return NextResponse.json({ ok: true, action: 'updated' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
