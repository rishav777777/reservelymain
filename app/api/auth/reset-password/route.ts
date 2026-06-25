import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email: string }

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type:    'recovery',
    email:   email.trim(),
    options: { redirectTo: `${appUrl}/auth/callback?next=/reset-password` },
  })

  // Always respond with success — never reveal whether email exists
  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ ok: true })
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to:      email.trim(),
      subject: 'Reset your Reservely password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0F172A">Reset your password</h2>
          <p style="color:#444">Click the button below to set a new password for your Reservely account.</p>
          <a href="${linkData.properties.action_link}"
             style="display:inline-block;margin:20px 0;padding:10px 24px;background:#0D472B;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">
            Reset password
          </a>
          <p style="color:#888;font-size:12px">This link expires in 1 hour. If you didn't request a password reset, ignore this email.</p>
        </div>
      `,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
