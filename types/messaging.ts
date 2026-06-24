export type SenderType = 'guest' | 'restaurant'

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
