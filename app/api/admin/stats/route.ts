import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdminClient()

  const today      = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    restaurantsRes,
    reservationsTodayRes,
    reservationsTotalRes,
    demoRes,
    newRes,
    plansRes,
    suspendedRes,
    setupRes,
  ] = await Promise.all([
    admin.from('restaurants').select('id', { count: 'exact', head: true }),
    admin.from('reservations').select('id', { count: 'exact', head: true }).eq('reservation_date', today),
    admin.from('reservations').select('id', { count: 'exact', head: true }),
    admin.from('demo_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('restaurants').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    admin.from('restaurants').select('subscription_plan'),
    admin.from('profiles').select('restaurant_id').eq('is_active', false).eq('role', 'owner'),
    admin.from('restaurants').select('id', { count: 'exact', head: true }).eq('setup_completed', true),
  ])

  const suspendedIds  = new Set((suspendedRes.data ?? []).map(p => p.restaurant_id))
  const total         = restaurantsRes.count ?? 0
  const setupComplete = setupRes.count ?? 0

  const planCounts: Record<string, number> = {}
  for (const r of (plansRes.data ?? [])) {
    const tier = (r.subscription_plan as string | null) ?? 'pro'
    planCounts[tier] = (planCounts[tier] ?? 0) + 1
  }

  const PRICES: Record<string, number> = { starter: 29, pro: 59, growth: 89 }
  const estimatedMrr = Object.entries(planCounts).reduce(
    (sum, [tier, count]) => sum + count * (PRICES[tier] ?? 59), 0
  )

  return NextResponse.json({
    total_restaurants:     total,
    active_restaurants:    total - suspendedIds.size,
    suspended_restaurants: suspendedIds.size,
    setup_completion_rate: total > 0 ? Math.round((setupComplete / total) * 100) : 0,
    new_this_month:        newRes.count ?? 0,
    reservations_today:    reservationsTodayRes.count ?? 0,
    reservations_total:    reservationsTotalRes.count ?? 0,
    pending_demo_requests: demoRes.count ?? 0,
    estimated_mrr:         estimatedMrr,
    plans: Object.entries(planCounts).map(([plan_tier, count]) => ({ plan_tier, count })),
  })
}
