import { createClient } from '@/lib/supabase/server'
import { getOverlappingTableIds } from '@/lib/table-allocator'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const date      = searchParams.get('date')
  const time      = searchParams.get('time')
  const partySize = parseInt(searchParams.get('party_size') ?? '1')
  const duration  = parseInt(searchParams.get('duration') ?? '120')
  const category  = searchParams.get('category')

  if (!date || !time) {
    return NextResponse.json({ tables: [] })
  }

  const supabase = await createClient()

  let tableQuery = supabase
    .from('restaurant_tables')
    .select('*')
    .eq('is_active', true)
    .gte('capacity', partySize)
    .order('category')
    .order('name')

  if (category) tableQuery = tableQuery.eq('category', category)
  const { data: allTables } = await tableQuery

  const { data: existing } = await supabase
    .from('reservations')
    .select('table_id, reservation_time, duration_minutes')
    .eq('reservation_date', date)
    .in('status', ['confirmed', 'arrived'])
    .not('table_id', 'is', null)

  const occupiedIds = getOverlappingTableIds(
    (existing ?? []) as Array<{
      table_id: string | null
      reservation_time: string
      duration_minutes: number
    }>,
    time,
    duration
  )

  const available = (allTables ?? []).filter((t) => !occupiedIds.includes(t.id))

  return NextResponse.json({ tables: available })
}
