// Meta WhatsApp Cloud API — Phase 3
// Requires: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID env vars

export interface WAMessage {
  to: string          // E.164 format: +49170...
  text: string
}

export interface WAReservationAlert {
  to:              string
  restaurantName:  string
  guestName:       string
  partySize:       number
  date:            string
  time:            string
  tableName:       string
  sessionIndex?:   number  // for multi-pending numbering
}

export async function sendWhatsAppText(_msg: WAMessage): Promise<void> {
  // TODO Phase 3: POST to Meta Cloud API
  // https://graph.facebook.com/v19.0/{phone_number_id}/messages
  throw new Error('WhatsApp integration not yet configured')
}

export async function sendReservationAlert(_alert: WAReservationAlert): Promise<string | null> {
  // Returns Meta message_id or null on failure
  // TODO Phase 3: send approved template message
  throw new Error('WhatsApp integration not yet configured')
}

export function parseWhatsAppIntent(body: string): 'confirm' | 'decline' | 'unknown' {
  const t = body.trim().toLowerCase()
  const confirmTokens = ['yes','ja','ok','1','confirm','klar','gerne','sure','yep','✓','✅']
  const declineTokens = ['no','nein','2','decline','cancel','ablehnen','nope','❌']
  if (confirmTokens.includes(t)) return 'confirm'
  if (declineTokens.includes(t)) return 'decline'
  // Multi-pending: "1y", "2n", etc.
  if (/^\d+y$/.test(t)) return 'confirm'
  if (/^\d+n$/.test(t)) return 'decline'
  return 'unknown'
}
