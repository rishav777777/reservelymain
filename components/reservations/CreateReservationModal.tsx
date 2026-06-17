'use client'

import { useState, useEffect } from 'react'
import { Reservation, RestaurantTable } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CreateReservationModalProps {
  open: boolean
  onClose: () => void
  onCreated: (reservation: Reservation) => void
}

const FALLBACK_CATEGORIES = ['Indoor', 'Outdoor', 'VIP', 'Bar']

const DURATION_OPTIONS = [
  { value: 30,  label: '30 min' },
  { value: 60,  label: '1 hour' },
  { value: 90,  label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
  { value: 210, label: '3.5 hours' },
  { value: 240, label: '4 hours' },
]

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = []
  for (let h = 12; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 22) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})()

const DEFAULT_DATE = new Date().toISOString().split('T')[0]

export function CreateReservationModal({ open, onClose, onCreated }: CreateReservationModalProps) {
  const [guestName, setGuestName]             = useState('')
  const [guestEmail, setGuestEmail]           = useState('')
  const [guestPhone, setGuestPhone]           = useState('')
  const [partySize, setPartySize]             = useState(2)
  const [date, setDate]                       = useState(DEFAULT_DATE)
  const [time, setTime]                       = useState('19:00')
  const [category, setCategory]               = useState('')
  const [duration, setDuration]               = useState(120)
  const [categories, setCategories]           = useState<string[]>([])
  const [specialRequests, setSpecialRequests] = useState('')
  const [messageText, setMessageText]         = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [availableTables, setAvailableTables] = useState<RestaurantTable[]>([])
  const [preferredTableId, setPreferredTableId] = useState('')
  const [loadingTables, setLoadingTables]     = useState(false)

  useEffect(() => {
    if (!date || !time || !partySize) { setAvailableTables([]); return }
    setLoadingTables(true)
    fetch(`/api/tables/available?date=${date}&time=${time}&party_size=${partySize}&duration=${duration}&category=${category}`)
      .then((r) => r.json())
      .then((d) => setAvailableTables(d.tables ?? []))
      .catch(() => setAvailableTables([]))
      .finally(() => setLoadingTables(false))
  }, [date, time, partySize, duration, category])

  useEffect(() => {
    if (!open) return
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories(FALLBACK_CATEGORIES))
  }, [open])

  function reset() {
    setGuestName('')
    setGuestEmail('')
    setGuestPhone('')
    setPartySize(2)
    setDate(DEFAULT_DATE)
    setTime('19:00')
    setCategory('')
    setDuration(120)
    setPreferredTableId('')
    setSpecialRequests('')
    setMessageText('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone || null,
          party_size: partySize,
          reservation_date: date,
          reservation_time: time,
          category: category || null,
          special_requests: specialRequests || null,
          duration_minutes: duration,
          preferred_table_id: preferredTableId || null,
          status: 'pending',
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Failed to create reservation')
        return
      }

      const newReservation: Reservation = body

      if (messageText.trim()) {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservation_id: newReservation.id,
            sender_type: 'guest',
            sender_name: guestName,
            content: messageText.trim(),
          }),
        })
      }

      toast.success('Reservation request created — pending approval')
      onCreated(newReservation)
      reset()
      onClose()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">New Reservation Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Guest Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Guest Name *</Label>
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Jane Smith"
              required
              className="h-8 text-sm"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Email *</Label>
              <Input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Phone</Label>
              <Input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+49 ..."
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Party Size + Category */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Party Size *</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={categories.length === 0 ? 'Loading...' : 'Any'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Duration</Label>
            <Select value={String(duration)} onValueChange={(v) => v && setDuration(Number(v))}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)} className="text-sm">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Time *</Label>
              <Select value={time} onValueChange={(v) => v && setTime(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot} className="text-sm">{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table preference */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">
              Table preference
              <span className="text-zinc-400 font-normal ml-1">— optional</span>
            </Label>
            <Select
              value={preferredTableId}
              onValueChange={(v) => v && setPreferredTableId(v)}
              disabled={loadingTables || availableTables.length === 0}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={
                  loadingTables ? 'Checking availability...' :
                  availableTables.length === 0 ? 'Set date, time & guests first' :
                  'Any available table'
                } />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-sm">
                    {t.name} — {t.category} · {t.capacity} seats
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Special Requests */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Special Requests</Label>
            <Textarea
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Birthday setup, accessibility needs, seating preference..."
              className="text-sm resize-none"
            />
          </div>

          {/* Message to restaurant */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">
              Message to restaurant
              <span className="text-zinc-400 font-normal ml-1">
                — Simulates a note sent by the guest during booking
              </span>
            </Label>
            <Textarea
              rows={2}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Any message for the restaurant team..."
              className="text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1 h-8 text-sm bg-brand-primary hover:bg-brand-primary/90 text-white"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-sm"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
