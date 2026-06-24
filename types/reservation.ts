export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'arrived'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'no_show'

export interface Reservation {
  id:               string
  restaurant_id:    string
  table_id:         string | null
  reference_code:   string
  guest_name:       string
  guest_email:      string
  guest_phone:      string | null
  party_size:       number
  reservation_date: string
  reservation_time: string
  duration_minutes: number
  category:         string | null
  status:           ReservationStatus
  special_requests: string | null
  menu_preference:  string | null
  notes:            string | null
  is_walk_in:       boolean
  guest_consented:  boolean
  consented_at:     string | null
  source:           'guest_portal' | 'walk_in' | 'phone' | 'whatsapp' | 'import' | 'dashboard' | 'quick_book' | null
  reminder_sent_at:   string | null
  reminder_24h_sent:  boolean
  reminder_2h_sent:   boolean
  confirmed_at:     string | null
  created_at:       string
  updated_at:       string
  restaurant_tables?: import('./table').RestaurantTable | null
}

export interface BookingData {
  guests: number
  date:   Date
  time:   string
}
