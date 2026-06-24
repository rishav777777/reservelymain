export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'paused'

export interface BillingStatus {
  status:           SubscriptionStatus
  plan:             string
  trial_ends_at:    string | null
  subscribed_until: string | null
  stripe_customer_id: string | null
}
