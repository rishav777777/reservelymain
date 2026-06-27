import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function logEmail({
  type,
  to,
  subject,
  restaurantId,
  status = 'sent',
  error,
}: {
  type:          string
  to:            string
  subject:       string
  restaurantId?: string | null
  status?:       'sent' | 'failed'
  error?:        string
}) {
  try {
    await getAdmin().from('email_logs').insert({
      type,
      to_email:      to,
      subject,
      restaurant_id: restaurantId ?? null,
      status,
      error:         error ?? null,
    })
  } catch {
    // Never throw — logging must not break email sending
  }
}
