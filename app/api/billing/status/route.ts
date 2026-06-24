import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('subscription_status, subscription_plan, stripe_customer_id, trial_ends_at, subscribed_until')
    .eq('id', profile.restaurant_id)
    .single()

  return NextResponse.json({
    status:           restaurant?.subscription_status ?? 'trialing',
    plan:             restaurant?.subscription_plan   ?? 'pro',
    stripe_customer_id: restaurant?.stripe_customer_id ?? null,
    trial_ends_at:    restaurant?.trial_ends_at       ?? null,
    subscribed_until: restaurant?.subscribed_until    ?? null,
  })
}
