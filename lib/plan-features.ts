export type PlanTier = 'starter' | 'pro' | 'growth'

interface PlanFeatures {
  maxReservationsPerMonth: number
  maxStaff:                number
  stammgast:               boolean
  groups:                  boolean
  analytics:               boolean
  floorPlan:               boolean
  whatsapp:                boolean
  advancedAnalytics:       boolean
  auditLog:                boolean
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  starter: {
    maxReservationsPerMonth: 200,
    maxStaff:                2,
    stammgast:               false,
    groups:                  false,
    analytics:               false,
    floorPlan:               false,
    whatsapp:                false,
    advancedAnalytics:       false,
    auditLog:                false,
  },
  pro: {
    maxReservationsPerMonth: Infinity,
    maxStaff:                5,
    stammgast:               true,
    groups:                  true,
    analytics:               true,
    floorPlan:               true,
    whatsapp:                false,
    advancedAnalytics:       false,
    auditLog:                false,
  },
  growth: {
    maxReservationsPerMonth: Infinity,
    maxStaff:                Infinity,
    stammgast:               true,
    groups:                  true,
    analytics:               true,
    floorPlan:               true,
    whatsapp:                true,
    advancedAnalytics:       true,
    auditLog:                true,
  },
}

export function canAccess(plan: string | null | undefined, feature: keyof PlanFeatures): boolean {
  const tier = PLAN_FEATURES[(plan ?? 'starter') as PlanTier] ?? PLAN_FEATURES.starter
  const val  = tier[feature]
  return typeof val === 'boolean' ? val : (val as number) > 0
}

export function getFeatures(plan: string | null | undefined): PlanFeatures {
  return PLAN_FEATURES[(plan ?? 'starter') as PlanTier] ?? PLAN_FEATURES.starter
}
