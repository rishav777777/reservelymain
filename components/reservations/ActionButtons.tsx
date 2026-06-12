'use client'

import { ReservationStatus } from '@/types'
import { Check, X, UserCheck, XCircle, CheckCircle, AlertCircle } from 'lucide-react'

type ActionConfig = {
  label: string
  targetStatus: ReservationStatus
  variant: 'primary' | 'ghost' | 'danger'
  icon: React.ReactNode
}

const ACTIONS_BY_STATUS: Record<ReservationStatus, ActionConfig[]> = {
  pending: [
    { label: 'Confirm', targetStatus: 'confirmed', variant: 'primary', icon: <Check size={12} /> },
    { label: 'Reject', targetStatus: 'rejected', variant: 'danger', icon: <X size={12} /> },
  ],
  confirmed: [
    { label: 'Mark Arrived', targetStatus: 'arrived', variant: 'primary', icon: <UserCheck size={12} /> },
    { label: 'Cancel', targetStatus: 'cancelled', variant: 'ghost', icon: <XCircle size={12} /> },
    { label: 'No Show', targetStatus: 'no_show', variant: 'ghost', icon: <AlertCircle size={12} /> },
  ],
  arrived: [
    { label: 'Completed', targetStatus: 'completed', variant: 'primary', icon: <CheckCircle size={12} /> },
    { label: 'No Show', targetStatus: 'no_show', variant: 'ghost', icon: <AlertCircle size={12} /> },
  ],
  completed: [],
  rejected: [],
  cancelled: [],
  no_show: [],
}

interface ActionButtonsProps {
  status: ReservationStatus
  loading: boolean
  onAction: (status: ReservationStatus) => void
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-[#E63946] hover:bg-[#c1121f] text-white',
  ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  danger: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
}

export function ActionButtons({ status, loading, onAction }: ActionButtonsProps) {
  const actions = ACTIONS_BY_STATUS[status] ?? []
  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.targetStatus}
          onClick={() => onAction(action.targetStatus)}
          disabled={loading}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${VARIANT_CLASSES[action.variant]}`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  )
}
