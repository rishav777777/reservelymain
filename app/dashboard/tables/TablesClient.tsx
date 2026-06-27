'use client'

import { useState } from 'react'
import { RestaurantTable, UserRole } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, ImageIcon, Power, PowerOff, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { TableDetailPanel } from '@/components/dashboard/tables/TableDetailPanel'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const CATEGORIES = ['Indoor', 'Outdoor', 'VIP', 'Bar']

interface TablesClientProps {
  tables: RestaurantTable[]
  restaurantId: string
  userRole: UserRole
}

export function TablesClient({ tables: initial, restaurantId, userRole }: TablesClientProps) {
  const { lang } = useLang()
  const tx = dashboardT[lang].tablesPage

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
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleToggleBlock(t: RestaurantTable) {
    setToggling(t.id)
    try {
      const res = await fetch(`/api/tables/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !t.is_active }),
      })
      if (!res.ok) { toast.error('Failed to update table'); return }
      const updated = await res.json()
      setTables(prev => prev.map(x => x.id === updated.id ? updated : x))
      toast.success(updated.is_active ? 'Table unblocked' : 'Table blocked')
    } catch {
      toast.error('Failed to update table')
    } finally {
      setToggling(null)
    }
  }

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
      toast.success(`${tx.modal.add} ${data.name}`)
    } catch {
      toast.error('Failed to add table')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">{tx.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{tx.subtitle(tables.length)}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus size={12} /> {tx.addTable}
          </button>
        )}
      </div>

      <div>
        {sortedCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <LayoutGrid className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-700 mb-1">No tables yet</p>
            <p className="text-xs text-zinc-400 max-w-xs">
              Add your first table to start accepting reservations and managing seating.
            </p>
            {canManage && (
              <button
                onClick={() => setAddOpen(true)}
                className="mt-5 flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors"
              >
                <Plus size={12} /> {tx.addTable}
              </button>
            )}
          </div>
        )}
        {sortedCategories.map((cat) => {
          const areaTables = grouped[cat]
          const stats = areaStats(areaTables)
          return (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-2 mb-2 px-1">
                <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">{cat}</h3>
                <span className="text-xs text-zinc-400">{tx.areaStats(stats.active, stats.total, stats.capacity)}</span>
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
                        <span className="text-gray-600 w-20 shrink-0">{tx.guests(t.capacity)}</span>
                        <span className="flex-1">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {t.is_active ? tx.active : tx.inactive}
                          </span>
                        </span>
                        {canManage && (
                          <button
                            onClick={() => handleToggleBlock(t)}
                            disabled={toggling === t.id}
                            title={t.is_active ? 'Block table' : 'Unblock table'}
                            className={`p-1.5 rounded transition-colors disabled:opacity-40 ${
                              t.is_active
                                ? 'text-zinc-400 hover:text-red-500 hover:bg-red-50'
                                : 'text-red-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {t.is_active ? <PowerOff size={13} /> : <Power size={13} />}
                          </button>
                        )}
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
            <DialogTitle className="text-sm font-semibold">{tx.modal.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">{tx.modal.name}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. T9"
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">{tx.modal.capacity}</Label>
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
              <Label className="text-xs font-medium text-gray-700">{tx.modal.category}</Label>
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
                {saving ? tx.modal.saving : tx.modal.add}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 text-sm"
                onClick={() => setAddOpen(false)}
              >
                {tx.modal.cancel}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
