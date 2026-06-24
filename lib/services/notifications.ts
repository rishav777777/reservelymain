// Notification orchestration — decides email vs WhatsApp vs both
// All functions are fire-and-forget safe (never throw to callers)

import { sendConfirmationEmail, sendRejectionEmail } from './email'
import { sendReservationAlert } from './whatsapp'
import type { Reservation } from '@/types'

interface RestaurantSettings {
  ownerWhatsapp:   string | null
  waNotifications: boolean
  name:            string
}

export async function notifyConfirmed(
  reservation: Reservation,
  restaurant:  RestaurantSettings,
): Promise<void> {
  // Email to guest (always)
  sendConfirmationEmail(reservation, restaurant.name).catch(() => {})

  // WhatsApp to owner (if configured) — not for confirmations, only for new bookings
  if (restaurant.ownerWhatsapp && restaurant.waNotifications) {
    sendReservationAlert({
      to:             restaurant.ownerWhatsapp,
      restaurantName: restaurant.name,
      guestName:      reservation.guest_name,
      partySize:      reservation.party_size,
      date:           reservation.reservation_date,
      time:           reservation.reservation_time,
      tableName:      reservation.table_id ?? '—',
    }).catch(() => {})
  }
}

export async function notifyRejected(reservation: Reservation, restaurantName: string): Promise<void> {
  sendRejectionEmail(reservation, restaurantName).catch(() => {})
}

export async function notifyReminder(_reservation: Reservation): Promise<void> {
  // TODO Phase 3: sendReminderEmail when implemented
}
