import { describe, it, expect } from 'vitest'
import { allocateTable, isWithinWindow, parseTimeToMinutes } from './table-allocator'
import type { RestaurantTable } from '@/types'

const makeTable = (overrides: Partial<RestaurantTable>): RestaurantTable => ({
  id: 'default-id',
  restaurant_id: 'r1',
  name: 'T1',
  capacity: 4,
  category: 'Indoor',
  is_active: true,
  created_at: '2024-01-01',
  ...overrides,
})

const TABLES: RestaurantTable[] = [
  makeTable({ id: 't1', name: 'T1', capacity: 2, category: 'Indoor' }),
  makeTable({ id: 't2', name: 'T2', capacity: 4, category: 'Indoor' }),
  makeTable({ id: 't3', name: 'T3', capacity: 4, category: 'Outdoor' }),
  makeTable({ id: 't4', name: 'T4', capacity: 6, category: 'Outdoor' }),
  makeTable({ id: 't5', name: 'T5', capacity: 8, category: 'VIP' }),
  makeTable({ id: 'b1', name: 'B1', capacity: 2, category: 'Bar' }),
]

describe('allocateTable', () => {
  it('returns smallest fitting table in preferred category', () => {
    const result = allocateTable(TABLES, 3, 'Indoor', [])
    expect(result?.id).toBe('t2') // 4-cap Indoor is smallest that fits 3
  })

  it('assigns 8-cap VIP table to 7-guest party (the reported bug scenario)', () => {
    const result = allocateTable(TABLES, 7, 'VIP', [])
    expect(result?.id).toBe('t5') // only 8-cap table fits 7
  })

  it('falls back to any category when preferred is fully booked', () => {
    const result = allocateTable(TABLES, 3, 'Indoor', ['t2'])
    // T2 booked, no other Indoor fits 3 → fallback to Outdoor t3 (4-cap)
    expect(result?.id).toBe('t3')
  })

  it('returns null when no table fits party size', () => {
    const result = allocateTable(TABLES, 10, 'Indoor', [])
    expect(result).toBeNull()
  })

  it('returns null when all fitting tables are booked', () => {
    const result = allocateTable(TABLES, 7, 'VIP', ['t5'])
    expect(result).toBeNull()
  })

  it('ignores inactive tables', () => {
    const withInactive = [
      ...TABLES,
      makeTable({ id: 't6', name: 'T6', capacity: 8, category: 'Indoor', is_active: false }),
    ]
    const result = allocateTable(withInactive, 8, 'Indoor', [])
    // t6 is inactive, only t5 (VIP) fits → fallback
    expect(result?.id).toBe('t5')
  })

  it('returns null for party size < 1', () => {
    expect(allocateTable(TABLES, 0, null, [])).toBeNull()
    expect(allocateTable(TABLES, -1, null, [])).toBeNull()
  })

  it('uses null category to skip category preference and pick global best fit', () => {
    const result = allocateTable(TABLES, 2, null, [])
    expect(result?.capacity).toBe(2) // T1 or B1 — smallest fitting
  })

  it('prefers category match over smaller non-category table', () => {
    // Party of 4, prefer Outdoor: should get t3 (4-cap Outdoor) not t2 (4-cap Indoor)
    const result = allocateTable(TABLES, 4, 'Outdoor', [])
    expect(result?.id).toBe('t3')
  })
})

describe('parseTimeToMinutes', () => {
  it('converts HH:MM to total minutes', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('12:00')).toBe(720)
    expect(parseTimeToMinutes('13:30')).toBe(810)
    expect(parseTimeToMinutes('23:59')).toBe(1439)
  })

  it('handles HH:MM:SS by using first two parts', () => {
    expect(parseTimeToMinutes('13:00:00')).toBe(780)
  })
})

describe('isWithinWindow', () => {
  it('returns true when times are identical', () => {
    expect(isWithinWindow('13:00', '13:00', 120)).toBe(true)
  })

  it('returns true when candidate is within window', () => {
    expect(isWithinWindow('13:00', '14:00', 120)).toBe(true)  // 60 min < 120
    expect(isWithinWindow('13:00', '11:30', 120)).toBe(true)  // 90 min < 120
  })

  it('returns false when candidate is outside window', () => {
    expect(isWithinWindow('13:00', '15:01', 120)).toBe(false) // 121 min > 120
    expect(isWithinWindow('13:00', '10:59', 120)).toBe(false) // 121 min > 120
  })

  it('returns false for next-day bookings (morning vs evening)', () => {
    // 08:00 booking vs 20:00 walk-in — should not block
    expect(isWithinWindow('20:00', '08:00', 120)).toBe(false) // 720 min apart
  })
})
