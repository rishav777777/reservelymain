import { createClient } from '@/lib/supabase/server'
import { createPortalUrl } from '@/lib/services/paddle'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('stripe_customer_id')
    .eq('id', profile.restaurant_id)
    .single()

  if (!restaurant?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`

  try {
    const url = await createPortalUrl(restaurant.stripe_customer_id, returnUrl)
    return NextResponse.json({ url })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Paddle error' },
      { status: 500 }
    )
  }
}
