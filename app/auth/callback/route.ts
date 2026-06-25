import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this is an invited user who needs a profile created
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const restaurantId = user.user_metadata?.restaurant_id as string | undefined
        const role         = (user.user_metadata?.role ?? 'owner') as string
        const fullName     = user.user_metadata?.full_name as string | undefined

        if (restaurantId) {
          // Check if profile already linked — if not, create it
          const { data: existing } = await supabase
            .from('profiles')
            .select('restaurant_id')
            .eq('id', user.id)
            .single()

          if (!existing?.restaurant_id) {
            const admin = createAdminClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            await admin.from('profiles').upsert({
              id:            user.id,
              restaurant_id: restaurantId,
              full_name:     fullName ?? '',
              email:         user.email ?? '',
              role,
              is_active:     true,
            }, { onConflict: 'id' })
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
