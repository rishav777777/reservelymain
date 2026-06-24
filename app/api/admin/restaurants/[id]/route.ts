import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin   = getAdminClient()

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name, slug, subscription_status, subscription_plan, subscribed_until, trial_ends_at, stripe_customer_id, booking_enabled, setup_completed, timezone, max_party_size, created_at')
    .eq('id', id)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [staffRes, reservRes, ownerRes, lastResRes] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('restaurant_id', id),
    admin.from('reservations').select('id', { count: 'exact', head: true }).eq('restaurant_id', id),
    admin.from('profiles').select('is_active').eq('restaurant_id', id).eq('role', 'owner').single(),
    admin.from('reservations').select('reservation_date, status').eq('restaurant_id', id).order('reservation_date', { ascending: false }).limit(1).single(),
  ])

  return NextResponse.json({
    restaurant: {
      ...restaurant,
      subscription_status: restaurant.subscription_status ?? 'trialing',
      subscription_plan:   restaurant.subscription_plan ?? 'pro',
      staff_count:         staffRes.count ?? 0,
      reservation_count:   reservRes.count ?? 0,
      owner_active:        ownerRes.data?.is_active ?? true,
      last_reservation:    lastResRes.data?.reservation_date ?? null,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id }           = await params
  const { owner_active } = await req.json()
  const admin            = getAdminClient()

  await admin
    .from('profiles')
    .update({ is_active: owner_active })
    .eq('restaurant_id', id)

  return NextResponse.json({ ok: true })
}
