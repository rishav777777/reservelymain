import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdminClient()
  const { data: requests } = await admin
    .from('demo_requests')
    .select('id, restaurant_name, contact_name, email, phone, city, venue_type, message, status, created_at, approved_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ requests: requests ?? [] })
}

export async function PATCH(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status } = await req.json()
  const VALID = ['pending', 'contacted', 'approved', 'closed']
  if (!id || !VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const admin = getAdminClient()
  const patch: Record<string, unknown> = { status }
  if (status === 'approved') patch.approved_at = new Date().toISOString()

  await admin.from('demo_requests').update(patch).eq('id', id)

  return NextResponse.json({ ok: true })
}
