'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Reservation, Notice, ReservationStatus } from '@/types'
import { QuickMetrics } from '@/components/dashboard/QuickMetrics'
import { Timeline } from '@/components/dashboard/Timeline'
import { PendingQueue } from '@/components/dashboard/PendingQueue'
import { NoticesPanel } from '@/components/dashboard/NoticesPanel'
import { ReservationDetailPanel } from '@/components/reservations/ReservationDetailPanel'
import { WalkInModal } from '@/components/walkin/WalkInModal'
import { CreateReservationModal } from '@/components/reservations/CreateReservationModal'
import { Plus, CalendarPlus, RotateCcw } from 'lucide-react'

interface DashboardClientProps {
  initialReservations: Reservation[]
  notices: Notice[]
  staffName: string
  greeting: string
  dateLabel: string
  totalTables: number
}

export function DashboardClient({
  initialReservations,
  notices,
  staffName,
  greeting,
  dateLabel,
  totalTables,
}: DashboardClientProps) {
  const router = useRouter()
  const [reservations, setReservations] = useState(initialReservations)

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(interval)
  }, [router])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const pending = reservations.filter((r) => r.status === 'pending')

  function handleSelectReservation(r: Reservation) {
    setSelectedReservation(r)
    setPanelOpen(true)
  }

  function handleStatusUpdate(id: string, updated: Reservation) {
    setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)))
    setSelectedReservation((prev) => (prev?.id === id ? updated : prev))
  }

  function handlePendingUpdate(id: string, newStatus: 'confirmed' | 'rejected') {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus as ReservationStatus } : r))
    )
  }

  function handleReservationCreated(reservation: Reservation) {
    setReservations((prev) =>
      [...prev, reservation].sort((a, b) =>
        a.reservation_time.localeCompare(b.reservation_time)
      )
    )
  }

  function handleWalkInCreated(reservation: Reservation) {
    setReservations((prev) =>
      [...prev, reservation].sort((a, b) =>
        a.reservation_time.localeCompare(b.reservation_time)
      )
    )
  }

  return (
    <div className="flex h-full">
      {/* Center — main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">
              {greeting}, {staffName}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.refresh()}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700 text-xs px-2 py-1.5 rounded-md transition-colors duration-150"
              title="Refresh dashboard"
            >
              <RotateCcw size={12} />
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-150"
            >
              <CalendarPlus size={12} /> New Reservation
            </button>
            <button
              onClick={() => setWalkInOpen(true)}
              className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-150"
            >
              <Plus size={12} /> Walk-in
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <QuickMetrics reservations={reservations} totalTables={totalTables} />

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Today's Timeline
            </p>
            <Timeline
              reservations={reservations}
              onSelectReservation={handleSelectReservation}
            />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-56 shrink-0 border-l border-zinc-200 bg-white overflow-auto">
        <div className="p-4 space-y-6">
          <PendingQueue reservations={pending} onUpdate={handlePendingUpdate} />
          <div className="border-t border-zinc-100 pt-5">
            <NoticesPanel notices={notices} />
          </div>
        </div>
      </aside>

      {/* Detail panel */}
      <ReservationDetailPanel
        reservation={selectedReservation}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onStatusUpdate={handleStatusUpdate}
        staffName={staffName}
      />

      {/* Walk-in modal */}
      <WalkInModal
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onCreated={handleWalkInCreated}
      />

      {/* New reservation modal */}
      <CreateReservationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleReservationCreated}
      />
    </div>
  )
}
