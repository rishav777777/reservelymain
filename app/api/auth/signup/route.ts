import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { logEmail } from '@/lib/services/email-logger'
import { signupLimiter, getClientIp } from '@/lib/ratelimit'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { success } = await signupLimiter.limit(ip).catch(() => ({ success: true }))
    if (!success) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { fullName, restaurantName, email, password, phone, city, venueType, message } =
      await request.json() as {
        fullName: string
        restaurantName: string
        email: string
        password: string
        phone?: string | null
        city?: string
        venueType?: string | null
        message?: string | null
      }

    if (!fullName?.trim() || !restaurantName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create auth user (email pre-confirmed — no verify email needed)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      user_metadata: { full_name: fullName.trim() },
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const userId = authData.user.id

    // Generate unique slug
    const baseSlug = slugify(restaurantName)
    const suffix   = Math.random().toString(36).slice(2, 6)
    const slug     = `${baseSlug}-${suffix}`

    // Create restaurant
    const { data: restaurant, error: restaurantError } = await admin
      .from('restaurants')
      .insert({ name: restaurantName.trim(), slug, subdomain: slug })
      .select('id')
      .single()

    if (restaurantError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Restaurant error: ${restaurantError.message}` },
        { status: 500 }
      )
    }

    // Create profile as inactive — account only becomes usable after admin approval
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id:            userId,
        restaurant_id: restaurant.id,
        full_name:     fullName.trim(),
        email:         email.trim(),
        role:          'owner',
        is_active:     false,
      }, { onConflict: 'id' })

    if (profileError) {
      await admin.from('restaurants').delete().eq('id', restaurant.id)
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Profile error: ${profileError.message}` },
        { status: 500 }
      )
    }

    // Insert into demo_requests so the admin panel shows this application
    await admin.from('demo_requests').insert({
      restaurant_name: restaurantName.trim(),
      contact_name:    fullName.trim(),
      email:           email.trim(),
      phone:           phone ?? null,
      city:            city?.trim() ?? '',
      venue_type:      venueType ?? null,
      message:         message ?? null,
    }).then(() => {}) // non-blocking, ignore failure

    // Send emails
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const from   = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

      // 1. Notify admin
      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        const adminSubject = `New restaurant signup — ${restaurantName}`
        await resend.emails.send({
          from,
          to: process.env.ADMIN_NOTIFICATION_EMAIL,
          subject: adminSubject,
          html: `
            <div style="font-family:sans-serif;max-width:480px">
              <h2 style="color:#0F172A">New signup requires review</h2>
              <table style="width:100%;font-size:14px">
                <tr><td style="color:#64748B;padding:4px 0">Restaurant</td><td><strong>${restaurantName}</strong></td></tr>
                <tr><td style="color:#64748B;padding:4px 0">Contact</td><td>${fullName}</td></tr>
                <tr><td style="color:#64748B;padding:4px 0">Email</td><td>${email}</td></tr>
                <tr><td style="color:#64748B;padding:4px 0">Phone</td><td>${phone ?? '—'}</td></tr>
                <tr><td style="color:#64748B;padding:4px 0">City</td><td>${city ?? '—'}</td></tr>
                <tr><td style="color:#64748B;padding:4px 0">Venue type</td><td>${venueType ?? '—'}</td></tr>
              </table>
              ${message ? `<p style="margin-top:16px;color:#444">${message}</p>` : ''}
              <p style="margin-top:20px">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/demo-requests"
                   style="background:#0D472B;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
                  Review in admin panel →
                </a>
              </p>
            </div>
          `,
        }).then(() => logEmail({ type: 'signup_admin_notification', to: process.env.ADMIN_NOTIFICATION_EMAIL!, subject: adminSubject })).catch(() => {})
      }

      // 2. Confirm receipt to the applicant
      const applicantSubject = 'Your Reservely application is under review'
      await resend.emails.send({
        from,
        to: email.trim(),
        subject: applicantSubject,
        html: `
          <div style="font-family:sans-serif;max-width:480px">
            <h2 style="color:#0F172A">Thanks for signing up, ${fullName.split(' ')[0]}!</h2>
            <p style="color:#444;font-size:14px;line-height:1.6">
              We've received your application for <strong>${restaurantName}</strong>.
              Our team will review it and activate your account within 24 hours.
            </p>
            <p style="color:#444;font-size:14px;line-height:1.6">
              Once approved, you'll receive another email and can log in at
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/login" style="color:#0D472B">
                ${process.env.NEXT_PUBLIC_APP_URL ?? 'reservely.app'}/login
              </a>
              using the email and password you set during signup.
            </p>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">
              If you have questions, reply to this email.
            </p>
          </div>
        `,
      }).then(() => logEmail({ type: 'signup_applicant_confirmation', to: email.trim(), subject: applicantSubject })).catch(() => {})
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
