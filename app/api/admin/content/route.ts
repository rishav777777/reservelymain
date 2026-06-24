import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

function getTable(type: string) {
  if (type === 'testimonials') return 'testimonials'
  if (type === 'faqs')         return 'faqs'
  return null
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const type  = new URL(req.url).searchParams.get('type')
  const table = getTable(type ?? '')
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const admin = getAdminClient()
  const { data } = await admin.from(table).select('*').order('sort_order').order('created_at', { ascending: false })

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body  = await req.json()
  const { type, ...payload } = body
  const table = getTable(type)
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin.from(table).insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ item: data })
}

export async function PATCH(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, type, ...patch } = await req.json()
  const table = getTable(type)
  if (!table || !id) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const admin = getAdminClient()
  await admin.from(table).update(patch).eq('id', id)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, type } = await req.json()
  const table = getTable(type)
  if (!table || !id) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const admin = getAdminClient()
  await admin.from(table).delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
