'use client'
import { useState, useEffect } from 'react'
import type { Restaurant } from '@/types'

export function useRestaurant(id: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/restaurants/${id}`)
      .then(r => r.json())
      .then(setRestaurant)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  return { restaurant, loading }
}
