import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reservely.de'
const FROM    = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // All trialing restaurants (not yet paid, not deleted)
  const { data: restaurants } = await admin
    .from('restaurants')
    .select('id, name, slug, created_at')
    .eq('subscription_status', 'trialing')
    .not('slug', 'is', null)
    .is('deleted_at', null)

  if (!restaurants?.length) return NextResponse.json({ sent: 0 })

  // Batch-fetch owner emails to avoid N+1
  const restaurantIds = restaurants.map(r => r.id as string)
  const { data: owners } = await admin
    .from('profiles')
    .select('restaurant_id, email')
    .in('restaurant_id', restaurantIds)
    .eq('role', 'owner')
    .eq('is_active', true)

  const ownerEmail = Object.fromEntries(
    (owners ?? []).map(o => [o.restaurant_id as string, o.email as string])
  )

  const resend  = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const today   = new Date()
  let sent      = 0
  const errors: string[] = []

  for (const r of restaurants) {
    const to = ownerEmail[r.id]
    if (!to) continue

    const daysSince  = Math.floor((today.getTime() - new Date(r.created_at).getTime()) / 86_400_000)
    const bookingUrl = `${APP_URL}/book/${r.slug}`
    const billingUrl = `${APP_URL}/dashboard/billing`

    let subject = ''
    let html    = ''

    if (daysSince === 7) {
      subject = 'Your booking page is live — share it today'
      html    = day7(r.name, bookingUrl)
    } else if (daysSince === 14) {
      const { count } = await admin
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', r.id)
        .gte('created_at', r.created_at)
      subject = "Two weeks in — here's what's working"
      html    = day14(r.name, count ?? 0, bookingUrl)
    } else if (daysSince === 21) {
      subject = 'Your trial ends in 9 days — lock in €59/month'
      html    = day21(r.name, billingUrl)
    } else if (daysSince === 28) {
      subject = 'Your booking page closes in 2 days'
      html    = day28(r.name, billingUrl)
    } else {
      continue
    }

    if (!resend) continue

    try {
      await resend.emails.send({ from: FROM, to, subject, html })
      sent++
    } catch (e) {
      errors.push(`${r.name}: ${String(e)}`)
    }
  }

  return NextResponse.json({ sent, ...(errors.length ? { errors } : {}) })
}

function wrap(inner: string) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">${inner}<p style="color:#94a3b8;font-size:12px;margin-top:32px">Reservely — Ihre Gäste, Ihre Daten.</p></div>`
}

function btn(url: string, label: string, color = '#0D472B') {
  return `<p style="margin-top:24px"><a href="${url}" style="background:${color};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">${label} →</a></p>`
}

function day7(name: string, bookingUrl: string) {
  return wrap(`
    <h2 style="font-size:20px;margin-bottom:4px">Your booking page is live! 🎉</h2>
    <p style="color:#666">Hi ${name} team,</p>
    <p style="color:#444;line-height:1.6">
      Your guests can now book directly — no Quandoo commission, no middleman.
    </p>
    <p style="color:#444;line-height:1.6">
      Share this link everywhere: your website, Instagram bio, WhatsApp status, reply emails.
    </p>
    ${btn(bookingUrl, 'View your booking page')}
  `)
}

function day14(name: string, count: number, bookingUrl: string) {
  return wrap(`
    <h2 style="font-size:20px;margin-bottom:4px">Two weeks in — here's what's working</h2>
    <p style="color:#666">Hi ${name} team,</p>
    <p style="color:#444;line-height:1.6">
      You've received <strong>${count} booking${count !== 1 ? 's' : ''}</strong> through Reservely in your first two weeks.
      Every one of those guests is now in your database — not Quandoo's.
    </p>
    <p style="color:#444;line-height:1.6">
      The fastest-growing restaurants share their booking link on WhatsApp status and Instagram every Friday afternoon.
    </p>
    ${btn(bookingUrl, 'Share your booking link')}
  `)
}

function day21(name: string, billingUrl: string) {
  return wrap(`
    <h2 style="font-size:20px;margin-bottom:4px">Your trial ends in 9 days</h2>
    <p style="color:#666">Hi ${name} team,</p>
    <p style="color:#444;line-height:1.6">
      Your 30-day free trial ends in 9 days. After that, your booking page pauses until you upgrade.
    </p>
    <p style="color:#444;font-size:14px;font-weight:600;margin:16px 0 4px">What you keep forever with a paid plan:</p>
    <ul style="color:#444;font-size:14px;line-height:2;margin:0 0 16px;padding-left:20px">
      <li>All your guest data (name, email, visit history)</li>
      <li>Your booking page at your Reservely URL</li>
      <li>Analytics, team accounts, and notifications</li>
    </ul>
    <p style="color:#444;font-size:14px"><strong>€59/month. No per-cover fees. Cancel anytime.</strong></p>
    ${btn(billingUrl, 'Upgrade now', '#E63946')}
  `)
}

function day28(name: string, billingUrl: string) {
  return wrap(`
    <h2 style="font-size:20px;margin-bottom:4px">Your booking page closes in 2 days</h2>
    <p style="color:#666">Hi ${name} team,</p>
    <p style="color:#444;line-height:1.6">
      This is your final reminder. Your trial ends in 2 days. After that, guests who visit your booking page will see it as unavailable.
    </p>
    <p style="color:#444;line-height:1.6">
      Upgrade for <strong>€59/month</strong> — that's less than Quandoo charges for 30 covers.
    </p>
    ${btn(billingUrl, 'Keep your booking page live', '#E63946')}
    <p style="color:#444;font-size:14px;margin-top:20px">
      Questions? Just reply to this email — we read every response.
    </p>
  `)
}
