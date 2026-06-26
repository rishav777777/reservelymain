import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdminClient()
  const tab   = new URL(req.url).searchParams.get('tab') ?? 'active'

  const [restaurantsRes, ownerProfilesRes, lastReservationsRes] = await Promise.all([
    admin
      .from('restaurants')
      .select('id, name, slug, subscription_status, subscription_plan, booking_enabled, setup_completed, created_at, deleted_at, deleted_reason, purge_after')
      .order('created_at', { ascending: false }),
    admin
      .from('profiles')
      .select('restaurant_id, is_active')
      .eq('role', 'owner'),
    admin
      .from('reservations')
      .select('restaurant_id, reservation_date')
      .order('reservation_date', { ascending: false })
      .limit(500),
  ])

  if (restaurantsRes.error) {
    return NextResponse.json({ error: restaurantsRes.error.message }, { status: 500 })
  }

  const activeMap: Record<string, boolean> = {}
  for (const p of ownerProfilesRes.data ?? []) {
    activeMap[p.restaurant_id] = p.is_active
  }

  const lastResMap: Record<string, string> = {}
  for (const r of lastReservationsRes.data ?? []) {
    if (!lastResMap[r.restaurant_id]) {
      lastResMap[r.restaurant_id] = r.reservation_date
    }
  }

  let all = (restaurantsRes.data ?? []).map(r => ({
    ...r,
    subscription_status: r.subscription_status ?? 'trialing',
    subscription_plan:   r.subscription_plan ?? 'pro',
    owner_active:        activeMap[r.id] ?? true,
    last_reservation:    lastResMap[r.id] ?? null,
  }))

  if (tab === 'deleted') {
    all = all.filter(r => r.deleted_at !== null)
  } else if (tab === 'suspended') {
    all = all.filter(r => r.deleted_at === null && !r.owner_active)
  } else {
    // 'active' tab: exclude deleted
    all = all.filter(r => r.deleted_at === null && r.owner_active)
  }

  return NextResponse.json({ restaurants: all })
}
