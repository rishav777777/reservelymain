import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdminClient()
  const { data: rows } = await admin.from('platform_settings').select('key, value')

  const settings: Record<string, unknown> = {}
  for (const row of rows ?? []) {
    settings[row.key] = row.value
  }

  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body: Record<string, unknown> = await req.json()
  const admin = getAdminClient()

  const upserts = Object.entries(body).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }))

  await admin.from('platform_settings').upsert(upserts, { onConflict: 'key' })

  return NextResponse.json({ ok: true })
}
