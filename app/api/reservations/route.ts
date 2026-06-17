import { createClient } from '@/lib/supabase/server'
import { getOverlappingTableIds } from '@/lib/table-allocator'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reservations')
    .select('*, restaurant_tables(name, capacity, category)')
    .eq('reservation_date', today)
    .order('reservation_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    guest_name,
    guest_email,
    guest_phone,
    party_size,
    reservation_date,
    reservation_time,
    category,
    special_requests,
    status = 'pending',
    duration_minutes = 120,
    preferred_table_id,
  } = body

  if (!guest_name?.trim() || !guest_email?.trim() || !party_size || !reservation_date || !reservation_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const refCode = 'RSV-' + Math.random().toString(36).toUpperCase().slice(2, 8)

  let assignedTableId: string | null = null

  if (preferred_table_id) {
    const { data: existing } = await supabase
      .from('reservations')
      .select('table_id, reservation_time, duration_minutes')
      .eq('reservation_date', reservation_date)
      .in('status', ['confirmed', 'arrived'])
      .not('table_id', 'is', null)

    const occupiedIds = getOverlappingTableIds(
      existing ?? [],
      reservation_time,
      duration_minutes
    )

    if (!occupiedIds.includes(preferred_table_id)) {
      assignedTableId = preferred_table_id
    }
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      restaurant_id: profile.restaurant_id,
      table_id: assignedTableId,
      reference_code: refCode,
      guest_name: guest_name.trim(),
      guest_email: guest_email.trim(),
      guest_phone: guest_phone?.trim() ?? null,
      party_size,
      reservation_date,
      reservation_time,
      category: category ?? null,
      special_requests: special_requests?.trim() ?? null,
      duration_minutes,
      status,
      is_walk_in: false,
    })
    .select('*, restaurant_tables(name, capacity, category)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
