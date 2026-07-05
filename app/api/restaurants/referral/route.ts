import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/restaurants/referral
// Returns (or creates) the referral link for the authenticated owner's restaurant.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id || profile.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('referral_code, referral_credits')
    .eq('id', profile.restaurant_id)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let code = restaurant.referral_code as string | null

  if (!code) {
    // Generate a unique 8-char alphanumeric code using CSPRNG
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // omit 0/O, 1/I to avoid ambiguity
    const bytes = new Uint8Array(8)
    let newCode: string
    let attempts = 0
    do {
      crypto.getRandomValues(bytes)
      newCode = Array.from(bytes).map(b => chars[b % chars.length]).join('')
      const { data: conflict } = await admin
        .from('restaurants')
        .select('id')
        .eq('referral_code', newCode)
        .maybeSingle()
      if (!conflict) break
      attempts++
    } while (attempts < 10)

    const { error: updateErr } = await admin
      .from('restaurants')
      .update({ referral_code: newCode })
      .eq('id', profile.restaurant_id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
    code = newCode
  }

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reservely.de'
  const referralUrl = `${appUrl}/signup?ref=${code}`

  // Count how many referrals converted (for display)
  const { count: convertedCount } = await admin
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', profile.restaurant_id)
    .not('converted_at', 'is', null)

  return NextResponse.json({
    code,
    url:        referralUrl,
    credits:    (restaurant.referral_credits as number) ?? 0,
    converted:  convertedCount ?? 0,
  })
}
