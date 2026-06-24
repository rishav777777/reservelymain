// Phase 3 — Meta WhatsApp Cloud API webhook
// GET: webhook verification (Meta sends challenge)
// POST: incoming messages (HMAC verified)
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST() {
  // TODO Phase 3: verify Meta HMAC signature, parse intent, update reservation
  return NextResponse.json({ ok: true })
}
