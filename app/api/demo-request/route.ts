import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantName, contactName, email, phone, city, venueType, message } = body

    if (!restaurantName || !contactName || !email || !city || !venueType) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await admin
      .from('demo_requests')
      .insert({
        restaurant_name: restaurantName,
        contact_name:    contactName,
        email,
        phone:           phone || null,
        city,
        venue_type:      venueType,
        message:         message || null,
      })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    if (process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFICATION_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Reservely <noreply@reservely.app>',
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New demo request — ${restaurantName}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px">
            <h2 style="color:#0F172A">New demo request</h2>
            <table style="width:100%;font-size:14px">
              <tr><td style="color:#64748B;padding:4px 0">Restaurant</td><td><strong>${restaurantName}</strong></td></tr>
              <tr><td style="color:#64748B;padding:4px 0">Contact</td><td>${contactName}</td></tr>
              <tr><td style="color:#64748B;padding:4px 0">Email</td><td>${email}</td></tr>
              <tr><td style="color:#64748B;padding:4px 0">Phone</td><td>${phone || '—'}</td></tr>
              <tr><td style="color:#64748B;padding:4px 0">City</td><td>${city}</td></tr>
              <tr><td style="color:#64748B;padding:4px 0">Venue type</td><td>${venueType}</td></tr>
            </table>
            ${message ? `<p style="margin-top:16px;color:#444">${message}</p>` : ''}
          </div>
        `,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
