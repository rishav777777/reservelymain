import { createClient } from '@/lib/supabase/server'
import { allocateTable, isWithinWindow } from '@/lib/table-allocator'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { party_size, category } = body as { party_size: number; category: string }

  if (!party_size || party_size < 1) {
    return NextResponse.json({ error: 'Invalid party size' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 401 })
  }

  const restaurantId = profile.restaurant_id
  const today = new Date().toISOString().split('T')[0]
  const nowTime = new Date().toTimeString().slice(0, 8)

  const { data: allTables } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)

  // Only block tables that are physically occupied right now:
  // - status 'arrived' (guests are seated, regardless of time)
  // - status 'confirmed' within a 2-hour window of the current time
  const { data: todayBooked } = await supabase
    .from('reservations')
    .select('table_id, reservation_time, status')
    .eq('restaurant_id', restaurantId)
    .eq('reservation_date', today)
    .in('status', ['confirmed', 'arrived'])

  const bookedIds = (todayBooked ?? [])
    .filter((r) => {
      if (r.status === 'arrived') return true
      return isWithinWindow(nowTime, r.reservation_time, 120)
    })
    .map((r) => r.table_id)
    .filter(Boolean) as string[]

  const allocated = allocateTable(allTables ?? [], party_size, category ?? null, bookedIds)

  if (!allocated) {
    return NextResponse.json(
      { error: `No available tables for ${party_size} guests in ${category}` },
      { status: 409 }
    )
  }

  const refCode = 'WLK-' + Math.random().toString(36).toUpperCase().slice(2, 8)

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      restaurant_id: restaurantId,
      table_id: allocated.id,
      reference_code: refCode,
      guest_name: 'Walk-in Guest',
      guest_email: 'walkin@reservely.local',
      party_size,
      reservation_date: today,
      reservation_time: nowTime,
      category,
      status: 'confirmed',
      is_walk_in: true,
    })
    .select('*, restaurant_tables(name, capacity, category)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    { reservation, table: allocated },
    { status: 201 }
  )
}
