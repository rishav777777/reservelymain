import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status } = await request.json()
    if (!['approved', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Status must be approved or declined' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: updatedRequest, error } = await admin
      .from('demo_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If approving — create restaurant record + send invitation
    if (status === 'approved' && updatedRequest) {
      try {
        // 1. Create the restaurant record
        const { data: newRestaurant, error: restaurantError } = await admin
          .from('restaurants')
          .insert({ name: updatedRequest.restaurant_name })
          .select()
          .single()

        if (restaurantError) throw new Error(restaurantError.message)

        // 2. Send Supabase invitation — metadata auto-links profile to restaurant
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        await admin.auth.admin.inviteUserByEmail(updatedRequest.email, {
          redirectTo: `${appUrl}/setup`,
          data: {
            full_name:     updatedRequest.contact_name,
            restaurant_id: newRestaurant.id,
            role:          'owner',
          },
        })
      } catch (inviteErr) {
        // Non-blocking: status is already saved; log but don't fail the response
        console.error('[demo-request] Invitation failed:', inviteErr)
      }
    }

    return NextResponse.json(updatedRequest)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
