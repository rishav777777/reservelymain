import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cancelLimiter, getClientIp } from '@/lib/ratelimit'
import { NextRequest, NextResponse } from 'next/server'

// ─── POST /api/reservations/[id]/cancel ───────────────────────────────────────
// Public — guests cancel their own reservation by supplying:
//   { reference_code: string, email: string }
// Both must match the reservation to prevent enumeration attacks.
// Only allows cancelling 'pending' or 'confirmed' reservations.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { success } = await cancelLimiter.limit(getClientIp(request)).catch(() => ({ success: true }))
  if (!success) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const { id } = await params
  const body = await request.json()
  const { reference_code, email } = body as { reference_code?: string; email?: string }

  if (!reference_code || !email) {
    return NextResponse.json(
      { error: 'reference_code and email are required' },
      { status: 422 }
    )
  }

  // Use admin client — this is a public endpoint with no user session
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: reservation, error: fetchErr } = await admin
    .from('reservations')
    .select('id, status, reference_code, guest_email, restaurant_id, reservation_date')
    .eq('id', id)
    .single()

  if (fetchErr || !reservation) {
    // Deliberately vague — prevents reservation ID enumeration
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }

  // Verify both reference_code AND email match — dual-factor ownership check
  const emailMatch = reservation.guest_email?.toLowerCase() === email.trim().toLowerCase()
  const refMatch   = reservation.reference_code?.toUpperCase() === reference_code.trim().toUpperCase()

  if (!emailMatch || !refMatch) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }

  const cancellable = ['pending', 'confirmed']
  if (!cancellable.includes(reservation.status)) {
    return NextResponse.json(
      { error: `Cannot cancel a reservation with status '${reservation.status}'` },
      { status: 422 }
    )
  }

  const { error: updateErr } = await admin
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, cancelled: true })
}
