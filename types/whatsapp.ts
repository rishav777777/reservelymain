export type WASessionStatus = 'awaiting_reply' | 'confirmed' | 'declined' | 'expired'

export interface WhatsAppSession {
  id:             string
  restaurant_id:  string
  reservation_id: string
  meta_message_id: string | null
  message_number: number
  status:         WASessionStatus
  expires_at:     string
  created_at:     string
}

export type WAIntent = 'confirm' | 'decline' | 'unknown'
