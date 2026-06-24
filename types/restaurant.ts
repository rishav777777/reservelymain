export type UserRole = 'owner' | 'manager' | 'staff'

export interface Restaurant {
  id:               string
  name:             string
  subdomain:        string
  slug:             string | null
  description:      string | null
  address:          string | null
  phone:            string | null
  email:            string | null
  cuisine_type:     string | null
  city:             string | null
  cover_image_url:  string | null
  created_at:       string
  // v3.0 fields
  timezone:          string | null
  booking_enabled:   boolean | null
  max_party_size:    number | null
  owner_whatsapp:    string | null
  wa_notifications:  boolean | null
  wa_daily_summary:  boolean | null
  setup_completed:   boolean | null
  // Stripe / billing (migration 017)
  stripe_customer_id:      string | null
  stripe_subscription_id:  string | null
  stripe_price_id:         string | null
  subscription_status:     string | null
  subscription_plan:       string | null
  trial_ends_at:           string | null
  subscribed_until:        string | null
}

export interface Profile {
  id:            string
  restaurant_id: string
  full_name:     string | null
  role:          UserRole
}

export interface StaffMember {
  id:        string
  full_name: string | null
  email:     string | null
  role:      UserRole
  is_active: boolean
}
