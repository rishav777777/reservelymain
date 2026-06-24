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

  // Fetch active zones so we can exclude tables in closed/out-of-season zones
  const { data: zones } = await supabase
    .from('floor_zones')
    .select('id, is_seasonal, season_start, season_end, is_open')

  // A zone is unavailable when:
  //   - is_open = false, OR
  //   - is_seasonal = true AND date is outside [season_start, season_end]
  const closedZoneIds = new Set<string>(
    (zones ?? []).filter(z => {
      if (!z.is_open) return true
      if (z.is_seasonal) {
        if (z.season_start && date < z.season_start) return true
        if (z.season_end   && date > z.season_end)   return true
      }
      return false
    }).map(z => z.id)
  )

  let tableQuery = supabase
    .from('restaurant_tables')
    .select('*, zone_id')
    .eq('is_active', true)
    .gte('capacity', partySize)
    .order('category')
    .order('name')

  if (category) tableQuery = tableQuery.eq('category', category)
  const { data: allTables } = await tableQuery

  // Filter out tables that belong to a closed/out-of-season zone
  const eligibleTables = (allTables ?? []).filter(
    t => !t.zone_id || !closedZoneIds.has(t.zone_id)
  )

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

  const available = eligibleTables.filter((t) => !occupiedIds.includes(t.id))

  return NextResponse.json({ tables: available })
}
