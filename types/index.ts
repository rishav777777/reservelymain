export type UserRole = 'owner' | 'manager' | 'staff'

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'arrived'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'no_show'

export type SenderType = 'guest' | 'restaurant'

export interface Restaurant {
  id: string
  name: string
  subdomain: string
  slug: string | null
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
}

export interface Profile {
  id: string
  restaurant_id: string
  full_name: string | null
  role: UserRole
}

export interface StaffMember {
  id:        string
  full_name: string | null
  email:     string | null
  role:      UserRole
  is_active: boolean
}

export interface RestaurantTable {
  id:            string
  restaurant_id: string
  name:          string
  capacity:      number
  category:      string
  is_active:     boolean
  image_url:     string | null
  image_urls:    string[]
  x:             number | null
  y:             number | null
  w:             number | null
  h:             number | null
  created_at:    string
}

export interface Reservation {
  id:                string
  restaurant_id:     string
  table_id:          string | null
  reference_code:    string
  guest_name:        string
  guest_email:       string
  guest_phone:       string | null
  party_size:        number
  reservation_date:  string
  reservation_time:  string
  duration_minutes:  number
  category:          string | null
  status:            ReservationStatus
  special_requests:  string | null
  menu_preference:   string | null
  notes:             string | null
  is_walk_in:        boolean
  guest_consented:   boolean
  created_at:        string
  updated_at:        string
  restaurant_tables?: RestaurantTable | null
}

export interface BookingData {
  guests: number
  date:   Date
  time:   string
}

export interface Message {
  id:             string
  reservation_id: string
  sender_type:    SenderType
  sender_name:    string | null
  content:        string
  created_at:     string
}

export interface Notice {
  id:            string
  restaurant_id: string
  content:       string
  created_by:    string | null
  created_at:    string
}

export interface AnalyticsData {
  reservationsPerDay: Array<{
    date:    string
    label:   string
    online:  number
    walkIn:  number
  }>
  peakHours: Array<{
    hour:  string
    count: number
  }>
  statusBreakdown: Array<{
    status: string
    count:  number
  }>
  summary: {
    total:            number
    approvalRate:     number | null
    noShowRate:       number | null
    cancellationRate: number | null
  }
}