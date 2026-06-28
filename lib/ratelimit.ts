import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 5 requests per IP per hour — for public endpoints (demo request)
export const demoRequestLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:demo',
})

// 20 requests per restaurant per hour — for resource creation
export const resourceLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'rl:resource',
})

// 60 requests per 10 minutes per IP — for table hold heartbeats (renews every ~30s)
export const holdLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '10 m'),
  prefix: 'rl:hold',
})

// 3 signups per IP per hour — prevents spam account creation
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:signup',
})

// 5 password reset requests per IP per hour — prevents email enumeration abuse
export const passwordResetLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:pwreset',
})

// 5 checkout URL generations per user per hour — prevents Paddle URL spam
export const checkoutLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:checkout',
})

// 5 cancellation attempts per IP per 10 min — prevents brute-force of reference_code+email
export const cancelLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'rl:cancel',
})

// 10 reservation lookups per IP per 10 min — prevents reference code enumeration on manage route
export const manageLookupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  prefix: 'rl:manage',
})

// Returns the client IP from a Next.js request
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
