import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { logEmail } from '@/lib/services/email-logger'

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

    const updatePayload: Record<string, unknown> = { status }
    if (status === 'approved') updatePayload.approved_at = new Date().toISOString()

    const { data: updatedRequest, error } = await admin
      .from('demo_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reservely.app'
    const from    = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    const resend  = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

    if (status === 'approved' && updatedRequest) {
      // Find the profile created during signup by email
      const { data: applicantProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', updatedRequest.email)
        .single()

      if (applicantProfile) {
        // Activate the existing account (created at signup)
        await admin
          .from('profiles')
          .update({ is_active: true })
          .eq('id', applicantProfile.id)

        // Also enable booking on their restaurant so it appears in the public directory
        const { data: ownerProfile } = await admin
          .from('profiles')
          .select('restaurant_id')
          .eq('id', applicantProfile.id)
          .single()
        if (ownerProfile?.restaurant_id) {
          await admin
            .from('restaurants')
            .update({ booking_enabled: true })
            .eq('id', ownerProfile.restaurant_id)
        }
      } else {
        // Fallback for requests submitted before the new signup flow:
        // create a restaurant record and send an invitation link
        try {
          const { data: newRestaurant } = await admin
            .from('restaurants')
            .insert({ name: updatedRequest.restaurant_name })
            .select()
            .single()

          if (newRestaurant) {
            await admin.auth.admin.inviteUserByEmail(updatedRequest.email, {
              redirectTo: `${appUrl}/setup`,
              data: {
                full_name:     updatedRequest.contact_name,
                restaurant_id: newRestaurant.id,
                role:          'owner',
              },
            })
          }
        } catch {
          // Non-blocking
        }
      }

      // Send approval email
      if (resend) {
        await resend.emails.send({
          from,
          to: updatedRequest.email,
          subject: 'Your Reservely account is approved! 🎉',
          html: `
            <div style="font-family:sans-serif;max-width:480px">
              <h2 style="color:#0D472B">You're approved!</h2>
              <p style="color:#444;font-size:14px;line-height:1.6">
                Hi ${updatedRequest.contact_name?.split(' ')[0] ?? 'there'},<br><br>
                Great news — your application for <strong>${updatedRequest.restaurant_name}</strong>
                has been approved. Your account is now active.
              </p>
              <p style="margin-top:20px">
                <a href="${appUrl}/login"
                   style="background:#0D472B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
                  Log in to your dashboard →
                </a>
              </p>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px">
                Log in with the email and password you set when you signed up.
              </p>
            </div>
          `,
        }).then(() => logEmail({ type: 'demo_approval', to: updatedRequest.email, subject: 'Your Reservely account is approved! 🎉' })).catch(() => {})
      }
    }

    if (status === 'declined' && updatedRequest) {
      if (resend) {
        const declineSubject = 'Update on your Reservely application'
        await resend.emails.send({
          from,
          to: updatedRequest.email,
          subject: declineSubject,
          html: `
            <div style="font-family:sans-serif;max-width:480px">
              <h2 style="color:#0F172A">Application update</h2>
              <p style="color:#444;font-size:14px;line-height:1.6">
                Hi ${updatedRequest.contact_name?.split(' ')[0] ?? 'there'},<br><br>
                Thank you for your interest in Reservely. Unfortunately, we're unable to
                approve your application for <strong>${updatedRequest.restaurant_name}</strong>
                at this time.
              </p>
              <p style="color:#444;font-size:14px;line-height:1.6">
                If you believe this is a mistake or would like more information,
                please reply to this email and we'll be happy to help.
              </p>
            </div>
          `,
        }).then(() => logEmail({ type: 'demo_rejection', to: updatedRequest.email, subject: declineSubject })).catch(() => {})
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
