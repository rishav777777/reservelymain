import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdminClient()
  const { data: requests, error } = await admin
    .from('demo_requests')
    .select('id, restaurant_name, contact_name, email, phone, city, venue_type, message, status, admin_notes, follow_up_at, created_at, approved_at, declined_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ requests: requests ?? [] })
}

export async function PATCH(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status, admin_notes, follow_up_at } = await req.json() as {
    id: string
    status: string
    admin_notes?: string
    follow_up_at?: string
  }

  const VALID = ['pending', 'contacted', 'approved', 'declined']
  if (!id || !VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const admin = getAdminClient()

  const { data: demoReq } = await admin
    .from('demo_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!demoReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patch: Record<string, unknown> = { status }
  if (admin_notes !== undefined) patch.admin_notes = admin_notes
  if (follow_up_at !== undefined) patch.follow_up_at = follow_up_at
  if (status === 'approved') patch.approved_at = new Date().toISOString()
  if (status === 'declined') patch.declined_at = new Date().toISOString()

  // Only run approval logic once
  if (status === 'approved' && demoReq.status !== 'approved') {

    // 1. Create restaurant
    const baseSlug = slugify(demoReq.restaurant_name)
    const suffix   = Math.random().toString(36).slice(2, 6)
    const slug     = `${baseSlug}-${suffix}`

    const { data: restaurant, error: restErr } = await admin
      .from('restaurants')
      .insert({ name: demoReq.restaurant_name, slug, subdomain: slug })
      .select('id')
      .single()

    if (restErr) {
      return NextResponse.json({ error: `Restaurant creation failed: ${restErr.message}` }, { status: 500 })
    }

    patch.restaurant_id = restaurant.id

    // 2. Check if user already exists via profiles table (fast — no listUsers())
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', demoReq.email)
      .maybeSingle()

    let warning: string | undefined

    if (existingProfile) {
      // Already has an account — link profile to new restaurant
      const { error: profileErr } = await admin
        .from('profiles')
        .update({ restaurant_id: restaurant.id, role: 'owner', is_active: true })
        .eq('id', existingProfile.id)

      if (profileErr) {
        await admin.from('restaurants').delete().eq('id', restaurant.id)
        return NextResponse.json({ error: `Profile link failed: ${profileErr.message}` }, { status: 500 })
      }
      warning = `${demoReq.email} already had an account — linked to new restaurant. They can log in now.`
    } else {
      // New user — create account + send welcome email via Resend
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

      // Create the auth user (email already confirmed — they'll set password via reset link)
      const { data: newAuthUser, error: createErr } = await admin.auth.admin.createUser({
        email:          demoReq.email,
        user_metadata:  { full_name: demoReq.contact_name, restaurant_id: restaurant.id, role: 'owner' },
        email_confirm:  true,
      })

      let authUserId: string

      if (createErr) {
        // If user already exists in auth, find them in profiles and reuse
        const { data: existingByEmail } = await admin
          .from('profiles')
          .select('id')
          .eq('email', demoReq.email)
          .maybeSingle()

        if (!existingByEmail) {
          await admin.from('restaurants').delete().eq('id', restaurant.id)
          return NextResponse.json({ error: `Account creation failed: ${createErr.message}` }, { status: 500 })
        }
        authUserId = existingByEmail.id
      } else {
        authUserId = newAuthUser.user.id
      }

      // Create/update the profile
      await admin.from('profiles').upsert({
        id:            authUserId,
        restaurant_id: restaurant.id,
        full_name:     demoReq.contact_name,
        email:         demoReq.email,
        role:          'owner',
        is_active:     true,
      }, { onConflict: 'id' })

      // Generate a password-reset link so they can set their own password
      const { data: linkData } = await admin.auth.admin.generateLink({
        type:    'recovery',
        email:   demoReq.email,
        options: { redirectTo: `${appUrl}/auth/callback?next=/reset-password` },
      })

      // Try to send via Resend — works once domain is verified
      // In dev (no verified domain), fall back to returning the link for manual sharing
      let setupLink: string | undefined
      const actionLink = linkData?.properties?.action_link

      if (process.env.RESEND_API_KEY && actionLink) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error: emailErr } = await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
          to:      demoReq.email,
          subject: 'Your Reservely account is ready',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#0F172A">Welcome, ${demoReq.contact_name}!</h2>
              <p style="color:#444">Your Reservely account for <strong>${demoReq.restaurant_name}</strong> has been approved.</p>
              <p style="color:#444">Click the button below to set your password and access your dashboard.</p>
              <a href="${actionLink}"
                 style="display:inline-block;margin:20px 0;padding:10px 24px;background:#0D472B;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">
                Set my password
              </a>
              <p style="color:#888;font-size:12px">This link expires in 1 hour.</p>
            </div>
          `,
        })
        // If email failed (unverified domain in dev), expose the link to the admin
        if (emailErr) setupLink = actionLink
      } else if (actionLink) {
        setupLink = actionLink
      }

      await admin.from('demo_requests').update(patch).eq('id', id)
      return NextResponse.json({ ok: true, setupLink })
    }

    await admin.from('demo_requests').update(patch).eq('id', id)
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) })
  }

  await admin.from('demo_requests').update(patch).eq('id', id)
  return NextResponse.json({ ok: true })
}
