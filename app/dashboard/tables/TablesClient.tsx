'use client'

import { useState } from 'react'
import { RestaurantTable, UserRole } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { TableDetailPanel } from '@/components/dashboard/tables/TableDetailPanel'

const CATEGORIES = ['Indoor', 'Outdoor', 'VIP', 'Bar']

interface TablesClientProps {
  tables: RestaurantTable[]
  restaurantId: string
  userRole: UserRole
}

export function TablesClient({ tables: initial, restaurantId, userRole }: TablesClientProps) {
  const canManage = userRole !== 'staff'
  const [tables, setTables] = useState(initial)
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const grouped = tables.reduce<Record<string, RestaurantTable[]>>((acc, table) => {
    if (!acc[table.category]) acc[table.category] = []
    acc[table.category].push(table)
    return acc
  }, {})
  const sortedCategories = Object.keys(grouped).sort()
  const areaStats = (ts: RestaurantTable[]) => ({
    total:    ts.length,
    active:   ts.filter((t) => t.is_active).length,
    capacity: ts.reduce((sum, t) => sum + t.capacity, 0),
  })
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(2)
  const [category, setCategory] = useState('Indoor')
  const [saving, setSaving] = useState(false)

  function openPanel(table: RestaurantTable) {
    setSelectedTable(table)
    setPanelOpen(true)
  }

  function handleTableUpdated(updated: RestaurantTable) {
    setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setSelectedTable(updated)
  }

  function handleTableDeleted(tableId: string) {
    setTables((prev) => prev.filter((t) => t.id !== tableId))
    if (selectedTable?.id === tableId) {
      setPanelOpen(false)
      setSelectedTable(null)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, capacity, category }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to add table'); return }
      setTables(prev => [...prev, data])
      setAddOpen(false)
      setName('')
      setCapacity(2)
      setCategory('Indoor')
      toast.success(`Table ${data.name} added`)
    } catch {
      toast.error('Failed to add table')
    } finally {
      setSaving(false)
    }
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, is_active: !t.is_active } : t))
    )
    toast.success(table.is_active ? `${table.name} deactivated` : `${table.name} activated`)
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Tables</h1>
          <p className="text-xs text-gray-400 mt-0.5">{tables.length} tables configured</p>
        </div>
        {canManage && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus size={12} /> Add Table
          </button>
        )}
      </div>

      <div>
        {sortedCategories.map((cat) => {
          const areaTables = grouped[cat]
          const stats = areaStats(areaTables)
          return (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-2 mb-2 px-1">
                <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">{cat}</h3>
                <span className="text-xs text-zinc-400">{stats.active}/{stats.total} tables · {stats.capacity} seats</span>
              </div>
              <div className="space-y-1.5">
                {areaTables
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t) => {
                    const thumbnail = t.image_urls?.[0] ?? t.image_url ?? null
                    return (
                      <div key={t.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-md px-4 py-3 text-xs hover:bg-gray-50">
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnail}
                            alt={t.name}
                            className="w-8 h-8 rounded object-cover border border-zinc-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 shrink-0 flex items-center justify-center">
                            <ImageIcon size={12} className="text-zinc-400" />
                          </div>
                        )}
                        <button
                          onClick={() => openPanel(t)}
                          className="font-medium text-gray-900 w-24 shrink-0 text-left hover:text-brand-primary transition-colors duration-150"
                        >
                          {t.name}
                        </button>
                        <span className="text-gray-600 w-20 shrink-0">{t.capacity} guests</span>
                        <span className="flex-1">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {t.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>

      <TableDetailPanel
        table={selectedTable}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUpdated={handleTableUpdated}
        onDeleted={handleTableDeleted}
        canManage={canManage}
      />

      <Dialog open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Add Table</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. T9"
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Capacity</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                className="flex-1 h-8 text-sm bg-brand-primary hover:bg-brand-primary/90 text-white"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Add Table'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 text-sm"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
