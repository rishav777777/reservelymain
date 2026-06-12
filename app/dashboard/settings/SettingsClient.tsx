'use client'

import { useState } from 'react'
import { Restaurant } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface SettingsClientProps {
  restaurant: Restaurant | null
}

export function SettingsClient({ restaurant }: SettingsClientProps) {
  const [form, setForm] = useState({
    name: restaurant?.name ?? '',
    description: restaurant?.description ?? '',
    address: restaurant?.address ?? '',
    phone: restaurant?.phone ?? '',
    email: restaurant?.email ?? '',
  })
  const [saving, setSaving] = useState(false)

  function handleChange(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurant?.id) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('restaurants')
      .update(form)
      .eq('id', restaurant.id)

    setSaving(false)
    if (error) {
      toast.error('Failed to save changes')
    } else {
      toast.success('Settings saved')
    }
  }

  return (
    <div className="p-5 max-w-lg">
      <div className="mb-5">
        <h1 className="text-sm font-semibold text-gray-900">Restaurant Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Update your restaurant information</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Restaurant Name</Label>
          <Input
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="text-sm resize-none"
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Address</Label>
          <Input
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Opening Hours</Label>
          <Input
            defaultValue="Mon–Sun: 11:30–22:00"
            className="h-8 text-sm"
          />
        </div>
        <Button
          type="submit"
          className="w-full h-8 text-sm bg-[#E63946] hover:bg-[#c1121f] text-white mt-2"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
