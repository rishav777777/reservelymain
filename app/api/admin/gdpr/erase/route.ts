import { getAdminClient, requireSuperAdmin } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

const ANON_NAME  = 'Anonymized Guest'
const ANON_EMAIL = 'anonymized@deleted.local'

// POST /api/admin/gdpr/erase
// GDPR Art. 17 — Right to erasure.
// Anonymises all PII for a given guest email across:
//   1. reservations (name, email, phone)
//   2. email_logs   (to_email — via DB function)
//   3. guest_profiles (row deleted)
// Returns a summary of what was touched.
export async function POST(request: NextRequest) {
  const adminUser = await requireSuperAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { email?: string }
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 422 })
  }

  // Basic email shape guard — not deep validation, just sanity check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 422 })
  }

  // Cannot erase already-anonymised records
  if (email === ANON_EMAIL) {
    return NextResponse.json({ error: 'That address is already anonymised' }, { status: 422 })
  }

  const admin = getAdminClient()

  // 1. Anonymise reservations — preserve the booking records, only wipe PII
  const { data: updatedReservations, error: resErr } = await admin
    .from('reservations')
    .update({
      guest_name:   ANON_NAME,
      guest_email:  ANON_EMAIL,
      guest_phone:  null,
    })
    .eq('guest_email', email)
    .select('id')

  if (resErr) {
    return NextResponse.json({ error: `Reservations update failed: ${resErr.message}` }, { status: 500 })
  }

  // 2. Anonymise email_logs via the DB function (created in migration 028)
  const { error: logErr } = await admin.rpc('anonymize_email_in_logs', { target_email: email })
  if (logErr) {
    // Non-fatal — email_logs table may not exist yet (migration 026 pending)
    // Log the warning but do not abort
    console.warn('[gdpr/erase] anonymize_email_in_logs failed:', logErr.message)
  }

  // 3. Delete guest_profiles row
  const { count: deletedProfiles, error: gpErr } = await admin
    .from('guest_profiles')
    .delete({ count: 'exact' })
    .eq('email', email)

  if (gpErr) {
    return NextResponse.json({ error: `Guest profile deletion failed: ${gpErr.message}` }, { status: 500 })
  }

  // 4. Audit trail
  void logAction({
    restaurant_id: '00000000-0000-0000-0000-000000000000', // platform-level action
    actor_id:      adminUser.id,
    actor_name:    adminUser.email ?? null,
    action:        'gdpr.erasure',
    target_type:   'guest_email',
    target_id:     email,
    metadata: {
      reservations_anonymised: updatedReservations?.length ?? 0,
      guest_profiles_deleted:  deletedProfiles ?? 0,
    },
  })

  return NextResponse.json({
    ok: true,
    reservations_anonymised: updatedReservations?.length ?? 0,
    guest_profiles_deleted:  deletedProfiles ?? 0,
    email_logs_anonymised:   !logErr,
  })
}
