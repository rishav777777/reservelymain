import { RestaurantTable } from '@/types'

/**
 * Best-fit table allocation.
 * 1. Try preferred category first → smallest table that fits party size
 * 2. Fallback to any category if preferred unavailable
 * Returns null if no suitable table exists.
 */
export function allocateTable(
  allTables: RestaurantTable[],
  partySize: number,
  preferredCategory: string | null,
  alreadyBookedTableIds: string[]
): RestaurantTable | null {
  if (partySize < 1) return null

  const available = allTables.filter(
    (t) => t.is_active && !alreadyBookedTableIds.includes(t.id)
  )

  const bestFit = (tables: RestaurantTable[]): RestaurantTable | null =>
    tables
      .filter((t) => t.capacity >= partySize)
      .sort((a, b) => a.capacity - b.capacity)[0] ?? null

  if (preferredCategory) {
    const inCategory = available.filter((t) => t.category === preferredCategory)
    const preferred = bestFit(inCategory)
    if (preferred) return preferred
  }

  return bestFit(available)
}

/**
 * Returns the booked table IDs within a time window around a target time.
 * windowMinutes: how many minutes before/after to consider a slot "occupied"
 */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function isWithinWindow(
  targetTime: string,
  candidateTime: string,
  windowMinutes = 120
): boolean {
  const target = parseTimeToMinutes(targetTime)
  const candidate = parseTimeToMinutes(candidateTime)
  return Math.abs(target - candidate) < windowMinutes
}
