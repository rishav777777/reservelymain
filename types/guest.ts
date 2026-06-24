export interface GuestProfile {
  id:            string
  restaurant_id: string
  email:         string
  name:          string | null
  phone:         string | null
  visit_count:   number
  first_visit:   string | null
  last_visit:    string | null
  is_stammgast:  boolean
  preferences:   Record<string, unknown>
  notes:         string | null
  created_at:    string
}

export interface RecurringReservation {
  id:               string
  restaurant_id:    string
  table_id:         string | null
  guest_name:       string
  guest_email:      string | null
  guest_phone:      string | null
  party_size:       number
  day_of_week:      number   // 0=Mon … 6=Sun
  start_time:       string
  duration_minutes: number
  label:            string | null
  notes:            string | null
  is_active:        boolean
  effective_from:   string
  effective_until:  string | null
  created_at:       string
  restaurant_tables?: { name: string; capacity: number } | null
}
