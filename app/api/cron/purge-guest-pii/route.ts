import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Runs daily. Anonymizes guest PII (name, email, phone) on reservations
// whose 60-day retention window has expired. GDPR Art. 5 storage limitation.
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()

  // Find reservations past their PII purge window that haven't been anonymized yet
  const { data: expired, error } = await admin
    .from('reservations')
    .select('id, guest_email, restaurant_id')
    .lte('pii_purge_after', now)
    .neq('guest_email', 'anonymized@deleted.local')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!expired?.length) return NextResponse.json({ ok: true, anonymized: 0 })

  // Anonymize in batches of 100
  const ids = expired.map((r: { id: string }) => r.id)
  const { error: updateErr } = await admin
    .from('reservations')
    .update({
      guest_name:  'Anonymized Guest',
      guest_email: 'anonymized@deleted.local',
      guest_phone: null,
    })
    .in('id', ids)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Remove guest_profiles whose email was just anonymized, if the profile's last_visit
  // is also in the expired set (avoids wiping a profile that still has recent bookings).
  const emailsToCheck = [...new Set(expired.map((r: { guest_email: string }) => r.guest_email))]

  for (const email of emailsToCheck) {
    const expiredRestaurants = expired
      .filter((r: { guest_email: string }) => r.guest_email === email)
      .map((r: { restaurant_id: string }) => r.restaurant_id)

    for (const restaurantId of expiredRestaurants) {
      // Only delete the profile if no recent (non-anonymized) reservations remain for this guest
      const { count } = await admin
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('guest_email', email) // still matches original email (not yet replaced)
        .gt('pii_purge_after', now)

      if ((count ?? 0) === 0) {
        await admin
          .from('guest_profiles')
          .delete()
          .eq('restaurant_id', restaurantId)
          .eq('email', email)
      }
    }
  }

  return NextResponse.json({ ok: true, anonymized: ids.length })
}
