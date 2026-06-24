import { Paddle, Environment } from '@paddle/paddle-node-sdk'

export function getPaddle(): Paddle {
  return new Paddle(process.env.PADDLE_API_KEY!, {
    environment: process.env.NODE_ENV === 'production'
      ? Environment.production
      : Environment.sandbox,
  })
}

export const PRICE_IDS: Record<string, string> = {
  starter: process.env.PADDLE_PRICE_STARTER ?? '',
  pro:     process.env.PADDLE_PRICE_PRO     ?? '',
  growth:  process.env.PADDLE_PRICE_GROWTH  ?? '',
}

export function planFromPriceId(priceId: string): string {
  return Object.entries(PRICE_IDS).find(([, id]) => id === priceId)?.[0] ?? 'unknown'
}

export async function createCheckoutUrl(
  restaurantId: string,
  email: string,
  priceId: string,
  returnUrl: string
): Promise<string> {
  const paddle = getPaddle()
  const txn = await paddle.transactions.create({
    items:        [{ priceId, quantity: 1 }],
    customerEmail: email,
    customData:   { restaurant_id: restaurantId },
    successUrl:   `${returnUrl}?checkout=success`,
    cancelUrl:    returnUrl,
  } as Parameters<typeof paddle.transactions.create>[0])
  return (txn as { checkout?: { url?: string } }).checkout?.url ?? returnUrl
}

export async function createPortalUrl(customerId: string, returnUrl: string): Promise<string> {
  const paddle = getPaddle()
  const session = await paddle.customerPortalSessions.create(customerId, [])
  return (session as { urls?: { general?: { overview?: string } } }).urls?.general?.overview ?? returnUrl
}
