'use client'

import { useState } from 'react'
import { RestaurantTable, UserRole } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['Indoor', 'Outdoor', 'VIP', 'Bar']

interface TablesClientProps {
  tables: RestaurantTable[]
  restaurantId: string
  userRole: UserRole
}

export function TablesClient({ tables: initial, restaurantId, userRole }: TablesClientProps) {
  const canManage = userRole !== 'staff'
  const [tables, setTables] = useState(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(2)
  const [category, setCategory] = useState('Indoor')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({ restaurant_id: restaurantId, name, capacity, category })
      .select()
      .single()

    if (error) {
      toast.error('Failed to add table')
      setSaving(false)
      return
    }
    setTables([...tables, data])
    setAddOpen(false)
    setName('')
    setCapacity(2)
    setCategory('Indoor')
    setSaving(false)
    toast.success(`Table ${data.name} added`)
  }

  async function handleToggle(table: RestaurantTable) {
    const supabase = createClient()
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ is_active: !table.is_active })
      .eq('id', table.id)

    if (error) {
      toast.error('Failed to update table')
      return
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Capacity</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-600">{t.capacity} guests</td>
                <td className="px-4 py-3 text-gray-600">{t.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      t.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {canManage && (
                    <button
                      onClick={() => handleToggle(t)}
                      className="text-gray-400 hover:text-gray-700 underline-offset-2 hover:underline transition-colors"
                    >
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                className="flex-1 h-8 text-sm bg-[#E63946] hover:bg-[#c1121f] text-white"
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
