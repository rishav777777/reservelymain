import { createClient } from '@/lib/supabase/server'
import { allocateTable, getOverlappingTableIds } from '@/lib/table-allocator'
import { sendConfirmationEmail, sendRejectionEmail } from '@/lib/email'
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

  const { data: existing, error: fetchErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
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

  // Fire-and-forget email — never block the response
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
