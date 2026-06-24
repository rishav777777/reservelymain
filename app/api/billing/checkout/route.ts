import { createClient } from '@/lib/supabase/server'
import { createCheckoutUrl, PRICE_IDS } from '@/lib/services/paddle'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

  const { plan } = await request.json() as { plan: string }
  const priceId = PRICE_IDS[plan]
  if (!priceId) return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 })

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`

  try {
    const url = await createCheckoutUrl(profile.restaurant_id, user.email!, priceId, returnUrl)
    return NextResponse.json({ url })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Paddle error' },
      { status: 500 }
    )
  }
}
