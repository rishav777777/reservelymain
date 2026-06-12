'use client'

import { useState, useEffect } from 'react'
import { Reservation, Message, ReservationStatus } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { StatusBadge } from './StatusBadge'
import { ActionButtons } from './ActionButtons'
import { MessageThread } from './MessageThread'
import { format } from 'date-fns'
import { Calendar, Users, Mail, Phone, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'

interface ReservationDetailPanelProps {
  reservation: Reservation | null
  open: boolean
  onClose: () => void
  onStatusUpdate: (id: string, updated: Reservation) => void
  staffName: string
}

export function ReservationDetailPanel({
  reservation,
  open,
  onClose,
  onStatusUpdate,
  staffName,
}: ReservationDetailPanelProps) {
  const [current, setCurrent] = useState<Reservation | null>(reservation)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    setCurrent(reservation)
  }, [reservation])

  useEffect(() => {
    setMessages([])
    if (!open || !reservation) return
    setLoadingMessages(true)

    fetch(`/api/messages?reservation_id=${reservation.id}`)
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoadingMessages(false))
  }, [open, reservation?.id])

  async function handleAction(status: ReservationStatus) {
    if (!current) return
    setLoading(true)

    try {
      const res = await fetch(`/api/reservations/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const body = await res.json()
        toast.error(body.error ?? 'Update failed')
        return
      }

      const updated: Reservation = await res.json()
      setCurrent(updated)
      onStatusUpdate(current.id, updated)
      toast.success(`Status updated to ${status}`)
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (!current) return null

  const tableName = current.restaurant_tables?.name ?? '—'
  const dateFormatted = (() => {
    try {
      return format(new Date(current.reservation_date), 'EEEE, d MMMM yyyy')
    } catch {
      return current.reservation_date
    }
  })()
  const timeFormatted = current.reservation_time.slice(0, 5)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-mono font-semibold text-gray-500">
              {current.reference_code}
            </SheetTitle>
            <StatusBadge status={current.status} />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Guest info */}
          <section>
            <p className="text-sm font-semibold text-gray-900 mb-2">{current.guest_name}</p>
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <Mail size={12} /> {current.guest_email}
              </p>
              {current.guest_phone && (
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={12} /> {current.guest_phone}
                </p>
              )}
            </div>
          </section>

          {/* Reservation details */}
          <section className="space-y-1.5">
            <p className="flex items-center gap-2 text-xs text-gray-700">
              <Calendar size={12} className="text-gray-400" />
              {dateFormatted} · {timeFormatted}
            </p>
            <p className="flex items-center gap-2 text-xs text-gray-700">
              <Users size={12} className="text-gray-400" />
              {current.party_size} guests · {current.category ?? '—'} · Table {tableName}
            </p>
          </section>

          {/* Requests */}
          {(current.special_requests || current.menu_preference || current.notes) && (
            <section className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Requests</p>
              {current.special_requests && (
                <div className="flex gap-2 text-xs text-gray-600">
                  <UtensilsCrossed size={12} className="text-gray-400 mt-0.5 shrink-0" />
                  <span>Special: {current.special_requests}</span>
                </div>
              )}
              {current.menu_preference && (
                <p className="text-xs text-gray-600 pl-4">Menu: {current.menu_preference}</p>
              )}
              {current.notes && (
                <p className="text-xs text-gray-600 pl-4">Notes: {current.notes}</p>
              )}
            </section>
          )}

          {/* Actions */}
          <section>
            <ActionButtons
              status={current.status}
              loading={loading}
              onAction={handleAction}
            />
          </section>

          {/* Message thread */}
          <section className="flex-1 min-h-[200px] flex flex-col">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Messages
            </p>
            {loadingMessages ? (
              <p className="text-xs text-gray-400">Loading messages...</p>
            ) : (
              <MessageThread
                key={current.id}
                reservationId={current.id}
                messages={messages}
                staffName={staffName}
              />
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
