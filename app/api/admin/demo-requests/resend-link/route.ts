import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email } = await req.json() as { email: string }
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const admin   = getAdminClient()
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type:    'recovery',
    email,
    options: { redirectTo: `${appUrl}/auth/callback?next=/reset-password` },
  })

  if (error || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? 'Failed to generate link' }, { status: 500 })
  }

  return NextResponse.json({ setupLink: linkData.properties.action_link })
}
