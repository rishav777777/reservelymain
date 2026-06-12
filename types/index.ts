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

export interface RestaurantTable {
  id: string
  restaurant_id: string
  name: string
  capacity: number
  category: string
  is_active: boolean
  created_at: string
}

export interface Reservation {
  id: string
  restaurant_id: string
  table_id: string | null
  reference_code: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  party_size: number
  reservation_date: string
  reservation_time: string
  category: string | null
  status: ReservationStatus
  special_requests: string | null
  menu_preference: string | null
  notes: string | null
  is_walk_in: boolean
  created_at: string
  updated_at: string
  restaurant_tables?: RestaurantTable | null
}

export interface Message {
  id: string
  reservation_id: string
  sender_type: SenderType
  sender_name: string | null
  content: string
  created_at: string
}

export interface Notice {
  id: string
  restaurant_id: string
  content: string
  created_by: string | null
  created_at: string
}
