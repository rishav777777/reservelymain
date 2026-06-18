import { createClient } from '@/lib/supabase/server'
import { allocateTable, getOverlappingTableIds } from '@/lib/table-allocator'
import { sendConfirmationEmail, sendRejectionEmail } from '@/lib/email'
import { logAction } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'
import { ReservationStatus } from '@/types'

const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending:   ['confirmed', 'rejected'],
  confirmed: ['arrived', 'cancelled', 'no_show'],
  arrived:   ['completed', 'no_show'],
  completed: [],
  rejected:  [],
  cancelled: [],
  no_show:   [],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { status } = body as { status: ReservationStatus }

  const supabase = await createClient()

  // Auth check — must be before any DB operation
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id, full_name').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: existing, error: fetchErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }

  // Ownership check — prevent cross-restaurant modification
  if (existing.restaurant_id !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowed = VALID_TRANSITIONS[existing.status as ReservationStatus] ?? []
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${existing.status} to ${status}` },
      { status: 422 }
    )
  }

  let tableId: string | undefined

  if (status === 'confirmed') {
    const { data: allTables } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', existing.restaurant_id)
      .eq('is_active', true)

    const { data: sameDay } = await supabase
      .from('reservations')
      .select('table_id, reservation_time, duration_minutes')
      .eq('restaurant_id', existing.restaurant_id)
      .eq('reservation_date', existing.reservation_date)
      .in('status', ['confirmed', 'arrived'])
      .neq('id', id)

    const occupiedIds = getOverlappingTableIds(
      sameDay ?? [],
      existing.reservation_time,
      existing.duration_minutes ?? 120
    )

    const allocated = allocateTable(
      allTables ?? [],
      existing.party_size,
      existing.category,
      occupiedIds
    )

    if (allocated) tableId = allocated.id
  }

  const update: Record<string, unknown> = { status }
  if (tableId) update.table_id = tableId

  const { data, error } = await supabase
    .from('reservations')
    .update(update)
    .eq('id', id)
    .select('*, restaurant_tables(name, capacity, category)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget audit log
  logAction({
    restaurant_id: existing.restaurant_id,
    actor_id:      user.id,
    actor_name:    profile.full_name ?? null,
    action:        `reservation.${status}`,
    target_type:   'reservation',
    target_id:     id,
    metadata: {
      reference_code: data.reference_code,
      guest_name:     data.guest_name,
      new_status:     status,
    },
  }).catch(() => {})

  // Fire-and-forget email
  if (status === 'confirmed' || status === 'rejected') {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', existing.restaurant_id)
      .single()
    const restaurantName = restaurant?.name ?? 'The Restaurant'
    const emailFn = status === 'confirmed' ? sendConfirmationEmail : sendRejectionEmail
    emailFn(data, restaurantName).catch(console.error)
  }

  return NextResponse.json(data)
}