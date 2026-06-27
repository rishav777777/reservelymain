import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/impersonate
// Body: { email: string, reason: string }
// Returns { url } — a one-time magic link that logs in as the target user.
// GDPR: reason is mandatory and every call is recorded in impersonation_logs.
export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, reason } = await request.json() as { email: string; reason: string }
  if (!email?.trim())  return NextResponse.json({ error: 'email required' },  { status: 400 })
  if (!reason?.trim()) return NextResponse.json({ error: 'reason required — required for GDPR audit trail' }, { status: 400 })

  const admin  = getAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data, error } = await admin.auth.admin.generateLink({
    type:    'magiclink',
    email:   email.trim(),
    options: { redirectTo: `${appUrl}/dashboard?_imp=1` },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? 'Failed to generate link' }, { status: 500 })
  }

  // Write to impersonation_logs BEFORE returning the link — if this fails, no link is returned.
  const { error: logError } = await admin.from('impersonation_logs').insert({
    admin_id:     user.id,
    admin_email:  user.email ?? '',
    target_email: email.trim(),
    reason:       reason.trim(),
    ip_address:   request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
  })

  if (logError) {
    // If we can't log it, we must not issue the link — audit trail is non-negotiable.
    return NextResponse.json(
      { error: 'Could not write audit log — impersonation blocked. Check impersonation_logs table.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: data.properties.action_link })
}
