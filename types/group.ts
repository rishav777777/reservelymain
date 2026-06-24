export interface GroupBooking {
  id:               string
  restaurant_id:    string
  organizer_name:   string
  organizer_email:  string
  organizer_phone:  string | null
  group_name:       string | null
  party_size:       number
  event_date:       string
  start_time:       string
  end_time:         string | null
  menu_type:        'set_menu' | 'a_la_carte' | 'buffet' | null
  special_requests: string | null
  deposit_required: boolean
  deposit_amount:   number | null
  deposit_paid_at:  string | null
  status:           'inquiry' | 'confirmed' | 'cancelled' | 'completed'
  notes:            string | null
  created_at:       string
}
