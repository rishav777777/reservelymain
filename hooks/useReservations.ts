'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Reservation } from '@/types'

export function useReservations(restaurantId: string, date?: string) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ restaurantId })
      if (date) params.set('date', date)
      const res  = await fetch(`/api/reservations?${params}`)
      const data = await res.json()
      setReservations(Array.isArray(data) ? data : data.reservations ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [restaurantId, date])

  useEffect(() => { refresh() }, [refresh])

  return { reservations, loading, error, refresh }
}
