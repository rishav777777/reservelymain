import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { getPaddle, planFromPriceId } from '@/lib/services/paddle'
import { NextRequest, NextResponse } from 'next/server'

// Paddle sends the raw body — do NOT parse as JSON before signature verification.
export async function POST(request: NextRequest) {
  const signature = request.headers.get('paddle-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const rawBody = await request.text()

  let eventData: Record<string, unknown>
  try {
    const paddle = getPaddle()
    const event = await paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    )
    eventData = event as unknown as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const eventType = eventData.event_type as string
  const data = eventData.data as Record<string, unknown>

  switch (eventType) {

    // Checkout completed — customer subscribed
    case 'transaction.completed': {
      const customData = data.custom_data as Record<string, string> | null
      const restaurantId = customData?.restaurant_id
      const customerId   = data.customer_id as string | null
      const subId        = data.subscription_id as string | null
      const items        = data.items as Array<{ price?: { id?: string } }> | null
      const priceId      = items?.[0]?.price?.id ?? null

      if (!restaurantId || !customerId) break

      await admin.from('restaurants').update({
        stripe_customer_id:     customerId,
        stripe_subscription_id: subId,
        stripe_price_id:        priceId,
        subscription_status:    'active',
        subscription_plan:      priceId ? planFromPriceId(priceId) : null,
      }).eq('id', restaurantId)
      break
    }

    // Subscription updated (plan change, renewal, trial ended)
    case 'subscription.updated': {
      const customerId = data.customer_id as string
      const subId      = data.id as string
      const status     = data.status as string
      const items      = data.items as Array<{ price?: { id?: string } }> | null
      const priceId    = items?.[0]?.price?.id ?? null
      const trialEnd   = (data as Record<string, unknown>).current_billing_period
        ? ((data as Record<string, { ends_at?: string }>).current_billing_period?.ends_at ?? null)
        : null

      const { data: restaurant } = await admin
        .from('restaurants')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!restaurant) break

      await admin.from('restaurants').update({
        stripe_subscription_id: subId,
        stripe_price_id:        priceId,
        subscription_status:    status === 'active' ? 'active' : status,
        subscription_plan:      priceId ? planFromPriceId(priceId) : null,
        subscribed_until:       trialEnd ?? null,
      }).eq('id', restaurant.id)
      break
    }

    // Payment succeeded for a billing period
    case 'transaction.payment_succeeded': {
      const customerId   = data.customer_id as string
      const subId        = data.subscription_id as string | null
      const billingPeriod = (data as Record<string, unknown>).billing_period as Record<string, string> | null
      const periodEnd    = billingPeriod?.ends_at ?? null

      const { data: restaurant } = await admin
        .from('restaurants')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!restaurant) break

      await admin.from('restaurants').update({
        stripe_subscription_id: subId,
        subscription_status:    'active',
        subscribed_until:       periodEnd,
      }).eq('id', restaurant.id)
      break
    }

    // Payment failed
    case 'transaction.payment_failed': {
      const customerId = data.customer_id as string
      const { data: restaurant } = await admin
        .from('restaurants')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!restaurant) break

      await admin.from('restaurants').update({ subscription_status: 'past_due' }).eq('id', restaurant.id)
      break
    }

    // Subscription cancelled
    case 'subscription.cancelled': {
      const subId = data.id as string
      const { data: restaurant } = await admin
        .from('restaurants')
        .select('id')
        .eq('stripe_subscription_id', subId)
        .single()
      if (!restaurant) break

      await admin.from('restaurants').update({ subscription_status: 'cancelled' }).eq('id', restaurant.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
