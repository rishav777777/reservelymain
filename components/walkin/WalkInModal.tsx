'use client'

import { useState } from 'react'
import { Reservation } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface WalkInModalProps {
  open: boolean
  onClose: () => void
  onCreated: (reservation: Reservation) => void
}

const CATEGORIES = ['Indoor', 'Outdoor', 'VIP', 'Bar']

export function WalkInModal({ open, onClose, onCreated }: WalkInModalProps) {
  const [partySize, setPartySize] = useState(2)
  const [category, setCategory] = useState('Indoor')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ party_size: partySize, category }),
      })

      const body = await res.json()

      if (!res.ok) {
        toast.error(body.error ?? 'Failed to create walk-in')
        return
      }

      const { reservation, table } = body
      toast.success(`Table ${table.name} (${table.category}) assigned — walk-in added`)
      onCreated(reservation)
      onClose()
      setPartySize(2)
      setCategory('Indoor')
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">New Walk-in</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Party size</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
              className="h-8 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Category preference</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-sm">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 h-8 text-sm bg-[#E63946] hover:bg-[#c1121f] text-white"
              disabled={loading}
            >
              {loading ? 'Assigning...' : 'Assign Table'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-sm"
              onClick={onClose}
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
