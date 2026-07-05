import { createClient } from '@/lib/supabase/server'
import { allocateTable, getOverlappingTableIds } from '@/lib/table-allocator'
import { sendConfirmationEmail, sendRejectionEmail, sendNoShowEmail } from '@/lib/services/email'
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
    .from('profiles').select('restaurant_id, full_name, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Staff may only mark arrived/completed/no_show — not confirm, reject, or cancel
  const STAFF_ALLOWED: ReservationStatus[] = ['arrived', 'completed', 'no_show']
  if (profile.role === 'staff' && !STAFF_ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Forbidden — staff cannot perform this action' }, { status: 403 })
  }

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
    // Attempt atomic allocation via DB function (migration 031 must be applied first).
    // Falls back to the in-process allocator if the RPC is unavailable.
    const { data: rpcResult, error: rpcErr } = await supabase
      .rpc('confirm_reservation_atomic', {
        p_reservation_id: id,
        p_restaurant_id:  existing.restaurant_id,
        p_date:           existing.reservation_date,
        p_time:           existing.reservation_time,
        p_duration:       existing.duration_minutes ?? 120,
        p_party_size:     existing.party_size,
        p_category:       existing.category ?? null,
      })

    if (!rpcErr && rpcResult?.[0]?.success) {
      // RPC confirmed + allocated atomically — fetch the updated row and return
      const { data, error: fetchErr } = await supabase
        .from('reservations')
        .select('*, restaurant_tables(name, capacity, category)')
        .eq('id', id)
        .single()
      if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

      logAction({
        restaurant_id: existing.restaurant_id,
        actor_id:      user.id,
        actor_name:    profile.full_name ?? null,
        action:        'reservation.confirmed',
        target_type:   'reservation',
        target_id:     id,
        metadata: { reference_code: data.reference_code, guest_name: data.guest_name, new_status: 'confirmed' },
      }).catch(() => {})

      if (process.env.RESEND_API_KEY) {
        const { data: restaurant } = await supabase
          .from('restaurants').select('name, slug').eq('id', existing.restaurant_id).single()
        sendConfirmationEmail(data, restaurant?.name ?? 'The Restaurant', restaurant?.slug ?? undefined).catch(() => {})
      }

      return NextResponse.json(data)
    }

    // Fallback: RPC not yet deployed — use in-process allocator (non-atomic)
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

    const allocated = allocateTable(allTables ?? [], existing.party_size, existing.category, occupiedIds)
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

  // Fire-and-forget guest profile upsert — only when the guest explicitly consented to profiling
  if (status === 'completed' && data.guest_email && data.profiling_consent === true) {
    ;(async () => {
      try {
        const { data: existing_guest } = await supabase
          .from('guest_profiles')
          .select('id, visit_count, first_visit')
          .eq('restaurant_id', existing.restaurant_id)
          .eq('email', data.guest_email)
          .single()

        if (existing_guest) {
          await supabase
            .from('guest_profiles')
            .update({
              name:        data.guest_name,
              phone:       data.guest_phone ?? null,
              last_visit:  data.reservation_date,
              visit_count: existing_guest.visit_count + 1,
            })
            .eq('id', existing_guest.id)
        } else {
          await supabase.from('guest_profiles').insert({
            restaurant_id: existing.restaurant_id,
            email:         data.guest_email,
            name:          data.guest_name,
            phone:         data.guest_phone ?? null,
            first_visit:   data.reservation_date,
            last_visit:    data.reservation_date,
            visit_count:   1,
          })
        }
      } catch { /* fire-and-forget — never throw to caller */ }
    })()
  }

  // Fire-and-forget email
  if (status === 'confirmed' || status === 'rejected' || status === 'no_show') {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name, slug')
      .eq('id', existing.restaurant_id)
      .single()
    const restaurantName = restaurant?.name ?? 'The Restaurant'
    if (status === 'confirmed') {
      sendConfirmationEmail(data, restaurantName, restaurant?.slug ?? undefined).catch(() => {})
    } else if (status === 'rejected') {
      sendRejectionEmail(data, restaurantName).catch(() => {})
    } else {
      sendNoShowEmail(data, restaurantName, restaurant?.slug ?? undefined).catch(() => {})
    }
  }

  return NextResponse.json(data)
}