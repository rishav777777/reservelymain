import { Resend } from 'resend'
import { Reservation } from '@/types'
import { logEmail } from './email-logger'

const FROM    = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  return `${h.padStart(2, '0')}:${m}`
}

export async function sendConfirmationEmail(reservation: Reservation, restaurantName: string, restaurantSlug?: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const tableLabel = reservation.restaurant_tables?.name
    ? ` — ${reservation.restaurant_tables.name}`
    : ''
  const subject = `Reservation confirmed at ${restaurantName} (${reservation.reference_code})`
  const manageUrl = restaurantSlug
    ? `${APP_URL}/book/${restaurantSlug}/manage?ref=${reservation.reference_code}&email=${encodeURIComponent(reservation.guest_email)}`
    : null

  try {
    await resend.emails.send({
      from: FROM,
      to: reservation.guest_email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="font-size:18px;margin-bottom:4px">Your reservation is confirmed</h2>
          <p style="color:#666;margin-top:0">Reference: <strong>${reservation.reference_code}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:40%">Restaurant</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${restaurantName}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Date</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${formatDate(reservation.reservation_date)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Time</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${formatTime(reservation.reservation_time)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Party size</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${reservation.party_size} guests</td></tr>
            ${tableLabel ? `<tr><td style="padding:8px 0;color:#666">Table</td><td style="padding:8px 0;font-weight:500">${reservation.restaurant_tables?.name}</td></tr>` : ''}
          </table>
          ${reservation.special_requests ? `<p style="background:#f9f9f9;padding:12px;border-radius:6px;font-size:14px;color:#444">Special requests: ${reservation.special_requests}</p>` : ''}
          ${manageUrl ? `<p style="margin-top:24px"><a href="${manageUrl}" style="color:#E63946;font-size:14px;text-decoration:underline">Manage or cancel this booking</a></p>` : ''}
          <p style="font-size:13px;color:#999;margin-top:32px">Powered by <a href="${APP_URL}" style="color:#E63946;text-decoration:none">Reservely</a></p>
        </div>
      `,
    })
    logEmail({ type: 'reservation_confirmation', to: reservation.guest_email, subject, restaurantId: reservation.restaurant_id }).catch(() => {})
  } catch (e) {
    logEmail({ type: 'reservation_confirmation', to: reservation.guest_email, subject, restaurantId: reservation.restaurant_id, status: 'failed', error: String(e) }).catch(() => {})
    throw e
  }
}

export async function sendReminderEmail(
  reservation: Reservation,
  restaurantName: string,
  type: '24h' | '2h'
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const hoursLabel = type === '24h' ? '24 hours' : '2 hours'
  const subject = `Reminder: Your reservation at ${restaurantName} is in ${hoursLabel}`

  try {
    await resend.emails.send({
      from: FROM,
      to: reservation.guest_email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="font-size:18px;margin-bottom:4px">See you soon at ${restaurantName}!</h2>
          <p style="color:#666;margin-top:0">This is a friendly reminder about your upcoming reservation.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:40%">Reference</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${reservation.reference_code}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Date</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${formatDate(reservation.reservation_date)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Time</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${formatTime(reservation.reservation_time)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Party size</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</td></tr>
            ${reservation.restaurant_tables?.name ? `<tr><td style="padding:8px 0;color:#666">Table</td><td style="padding:8px 0;font-weight:500">${reservation.restaurant_tables.name}</td></tr>` : ''}
          </table>
          <p style="font-size:13px;color:#999;margin-top:32px">Powered by <a href="${APP_URL}" style="color:#E63946;text-decoration:none">Reservely</a></p>
        </div>
      `,
    })
    logEmail({ type: `reservation_reminder_${type}`, to: reservation.guest_email, subject, restaurantId: reservation.restaurant_id }).catch(() => {})
  } catch (e) {
    logEmail({ type: `reservation_reminder_${type}`, to: reservation.guest_email, subject, restaurantId: reservation.restaurant_id, status: 'failed', error: String(e) }).catch(() => {})
    throw e
  }
}

export async function sendNoShowEmail(reservation: Reservation, restaurantName: string, restaurantSlug?: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `We missed you at ${restaurantName} — book again anytime`
  const bookUrl = restaurantSlug ? `${APP_URL}/book/${restaurantSlug}` : null

  try {
    await resend.emails.send({
      from: FROM,
      to: reservation.guest_email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="font-size:18px;margin-bottom:4px">We missed you!</h2>
          <p style="color:#666;margin-top:0">
            Hi ${reservation.guest_name.split(' ')[0]}, we had a table reserved for you at
            <strong>${restaurantName}</strong> on <strong>${formatDate(reservation.reservation_date)}</strong>
            at <strong>${formatTime(reservation.reservation_time)}</strong> but you didn't make it.
          </p>
          <p style="color:#444;line-height:1.6">
            No worries — things happen. Whenever you're ready to visit us again, you can book directly:
          </p>
          ${bookUrl ? `<p style="margin-top:20px"><a href="${bookUrl}" style="background:#0D472B;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">Book a table →</a></p>` : ''}
          <p style="font-size:13px;color:#999;margin-top:32px">Powered by <a href="${APP_URL}" style="color:#E63946;text-decoration:none">Reservely</a></p>
        </div>
      `,
    })
    logEmail({ type: 'reservation_no_show', to: reservation.guest_email, subject, restaurantId: reservation.restaurant_id }).catch(() => {})
  } catch (e) {
    logEmail({ type: 'reservation_no_show', to: reservation.guest_email, subject, restaurantId: reservation.restaurant_id, status: 'failed', error: String(e) }).catch(() => {})
    throw e
  }
}

export async function sendRejectionEmail(reservation: Reservation, restaurantName: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `Reservation update from ${restaurantName} (${reservation.reference_code})`

  try {
    await resend.emails.send({
      from: FROM,
      to: reservation.guest_email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="font-size:18px;margin-bottom:4px">We're sorry — your reservation could not be confirmed</h2>
          <p style="color:#666;margin-top:0">Reference: <strong>${reservation.reference_code}</strong></p>
          <p style="color:#444;line-height:1.6">
            Unfortunately, <strong>${restaurantName}</strong> is unable to accommodate your reservation for
            <strong>${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</strong> on
            <strong>${formatDate(reservation.reservation_date)}</strong> at
            <strong>${formatTime(reservation.reservation_time)}</strong>.
          </p>
          <p style="color:#444;line-height:1.6">
            We apologise for the inconvenience. Please try booking a different time or contact the restaurant directly.
          </p>
          <p style="font-size:13px;color:#999;margin-top:32px">Powered by <a href="${APP_URL}" style="color:#E63946;text-decoration:none">Reservely</a></p>
        </div>
      `,
    })
    logEmail({ type: 'reservation_rejection', to: reservation.guest_email, subject, restaurantId: reservation.restaurant_id }).catch(() => {})
  } catch (e) {
    logEmail({ type: 'reservation_rejection', to: reservation.guest_email, subject, restaurantId: reservation.restaurant_id, status: 'failed', error: String(e) }).catch(() => {})
    throw e
  }
}
