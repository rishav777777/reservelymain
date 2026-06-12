import { Resend } from 'resend'
import { Reservation } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Reservely <noreply@reservely.app>'
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
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

export async function sendConfirmationEmail(reservation: Reservation, restaurantName: string) {
  const tableLabel = reservation.restaurant_tables?.name
    ? ` — ${reservation.restaurant_tables.name}`
    : ''

  await resend.emails.send({
    from: FROM,
    to: reservation.guest_email,
    subject: `Reservation confirmed at ${restaurantName} (${reservation.reference_code})`,
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
        <p style="font-size:13px;color:#999;margin-top:32px">Powered by <a href="${APP_URL}" style="color:#E63946;text-decoration:none">Reservely</a></p>
      </div>
    `,
  })
}

export async function sendRejectionEmail(reservation: Reservation, restaurantName: string) {
  await resend.emails.send({
    from: FROM,
    to: reservation.guest_email,
    subject: `Reservation update from ${restaurantName} (${reservation.reference_code})`,
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
}
