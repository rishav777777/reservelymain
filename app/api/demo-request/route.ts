import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { demoRequestLimiter, getClientIp } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = admin
    .from('demo_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && ['pending', 'approved', 'declined'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    try {
      const { success, limit, remaining } = await demoRequestLimiter.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit':     String(limit),
              'X-RateLimit-Remaining': String(remaining),
            },
          }
        )
      }
    } catch {
      // Fails open — rate limit unavailable
    }

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
