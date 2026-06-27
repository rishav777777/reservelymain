import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/impersonate
// Body: { email: string }
// Returns a one-time magic link that logs in as that user.
// Only accessible to super admins. The link redirects to /dashboard.

export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email } = await request.json() as { email: string }
  if (!email?.trim()) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const admin  = getAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data, error } = await admin.auth.admin.generateLink({
    type:    'magiclink',
    email:   email.trim(),
    options: { redirectTo: `${appUrl}/dashboard` },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? 'Failed to generate link' }, { status: 500 })
  }

  return NextResponse.json({ url: data.properties.action_link })
}
