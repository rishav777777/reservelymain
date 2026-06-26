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
    .select('id, name, slug, subscription_status, subscription_plan, subscribed_until, trial_ends_at, stripe_customer_id, booking_enabled, setup_completed, timezone, max_party_size, created_at, deleted_at, deleted_reason, purge_after')
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

  const { id }    = await params
  const body      = await req.json() as { owner_active?: boolean; reactivate?: boolean }
  const admin     = getAdminClient()

  if (body.reactivate) {
    // Clear soft-delete and reactivate the owner account
    await Promise.all([
      admin
        .from('restaurants')
        .update({ deleted_at: null, deleted_reason: null, purge_after: null })
        .eq('id', id),
      admin
        .from('profiles')
        .update({ is_active: true })
        .eq('restaurant_id', id)
        .eq('role', 'owner'),
    ])
    return NextResponse.json({ ok: true })
  }

  if (typeof body.owner_active === 'boolean') {
    await admin
      .from('profiles')
      .update({ is_active: body.owner_active })
      .eq('restaurant_id', id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id }     = await params
  const { reason } = await req.json() as { reason?: string }
  const admin      = getAdminClient()

  const now        = new Date()
  const purgeAfter = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // +90 days

  // Soft-delete: stamp the restaurant and suspend all accounts
  await Promise.all([
    admin
      .from('restaurants')
      .update({
        deleted_at:     now.toISOString(),
        deleted_reason: reason ?? null,
        purge_after:    purgeAfter.toISOString(),
      })
      .eq('id', id),
    admin
      .from('profiles')
      .update({ is_active: false })
      .eq('restaurant_id', id),
  ])

  return NextResponse.json({ ok: true, purge_after: purgeAfter.toISOString() })
}
