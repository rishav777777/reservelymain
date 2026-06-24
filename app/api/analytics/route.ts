import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (profile.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden — staff cannot view analytics' }, { status: 403 })
  }

  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '7')

  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  const fromStr = fromDate.toISOString().split('T')[0]

  const { data: rows } = await supabase
    .from('reservations')
    .select('reservation_date, reservation_time, is_walk_in, status')
    .eq('restaurant_id', profile.restaurant_id)
    .gte('reservation_date', fromStr)
    .order('reservation_date', { ascending: true })

  if (!rows) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  // Build date buckets for the full range (fill gaps with 0)
  const dateBuckets: Record<string, { online: number; walkIn: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dateBuckets[d.toISOString().split('T')[0]] = { online: 0, walkIn: 0 }
  }
  rows.forEach(r => {
    if (!dateBuckets[r.reservation_date]) return
    if (r.is_walk_in) dateBuckets[r.reservation_date].walkIn++
    else dateBuckets[r.reservation_date].online++
  })
  const reservationsPerDay = Object.entries(dateBuckets).map(([date, v]) => ({
    date,
    label: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
    online: v.online,
    walkIn: v.walkIn,
  }))

  // Peak hours
  const hourCounts: Record<string, number> = {}
  rows.forEach(r => {
    const hour = r.reservation_time.slice(0, 2) + ':00'
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1
  })
  const peakHours = Object.entries(hourCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }))

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  rows.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1 })
  const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  // Summary rates
  const total = rows.length
  const confirmed = rows.filter(r => ['confirmed', 'arrived', 'completed'].includes(r.status)).length
  const rejected  = rows.filter(r => r.status === 'rejected').length
  const noShow    = rows.filter(r => r.status === 'no_show').length
  const cancelled = rows.filter(r => r.status === 'cancelled').length
  const decided   = confirmed + rejected
  const arrived   = rows.filter(r => ['arrived', 'completed', 'no_show'].includes(r.status)).length

  return NextResponse.json({
    reservationsPerDay,
    peakHours,
    statusBreakdown,
    summary: {
      total,
      approvalRate:     decided > 0 ? Math.round((confirmed / decided) * 100) : null,
      noShowRate:       arrived > 0 ? Math.round((noShow / arrived) * 100) : null,
      cancellationRate: confirmed > 0 ? Math.round((cancelled / confirmed) * 100) : null,
    },
  })
}
