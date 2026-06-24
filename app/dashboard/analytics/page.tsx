import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './AnalyticsClient'

const DAYS = 30

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'staff') redirect('/dashboard')

  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - DAYS)
  const fromStr = fromDate.toISOString().split('T')[0]

  const { data: rows } = await supabase
    .from('reservations')
    .select('reservation_date, reservation_time, is_walk_in, status')
    .gte('reservation_date', fromStr)
    .order('reservation_date', { ascending: true })

  const safeRows = rows ?? []

  // Date buckets — one entry per day going back DAYS days
  const dateBuckets: Record<string, { online: number; walkIn: number }> = {}
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dateBuckets[d.toISOString().split('T')[0]] = { online: 0, walkIn: 0 }
  }
  safeRows.forEach(r => {
    if (!dateBuckets[r.reservation_date]) return
    if (r.is_walk_in) dateBuckets[r.reservation_date].walkIn++
    else dateBuckets[r.reservation_date].online++
  })
  const reservationsPerDay = Object.entries(dateBuckets).map(([date, v]) => ({
    date,
    online: v.online,
    walkIn: v.walkIn,
  }))

  // Peak hours
  const hourCounts: Record<string, number> = {}
  safeRows.forEach(r => {
    const hour = r.reservation_time.slice(0, 2) + ':00'
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1
  })
  const peakHours = Object.entries(hourCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }))

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  safeRows.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1 })
  const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  // Summary
  const total     = safeRows.length
  const confirmed = safeRows.filter(r => ['confirmed', 'arrived', 'completed'].includes(r.status)).length
  const rejected  = safeRows.filter(r => r.status === 'rejected').length
  const noShow    = safeRows.filter(r => r.status === 'no_show').length
  const cancelled = safeRows.filter(r => r.status === 'cancelled').length
  const decided   = confirmed + rejected
  const arrived   = safeRows.filter(r => ['arrived', 'completed', 'no_show'].includes(r.status)).length

  const initialData = {
    reservationsPerDay,
    peakHours,
    statusBreakdown,
    summary: {
      total,
      approvalRate:     decided > 0     ? Math.round((confirmed / decided) * 100)   : null,
      noShowRate:       arrived > 0     ? Math.round((noShow    / arrived) * 100)   : null,
      cancellationRate: confirmed > 0   ? Math.round((cancelled / confirmed) * 100) : null,
    },
  }

  return <AnalyticsClient initialData={initialData} />
}
