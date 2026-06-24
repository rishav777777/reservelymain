import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export function getAdminClient(): SupabaseClient {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Returns the authenticated user if they are a superadmin, null otherwise.
// Uses the service-role client to bypass RLS on profiles.
export async function requireSuperAdmin(): Promise<{ id: string; email?: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = getAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  return profile?.is_superadmin ? user : null
}
