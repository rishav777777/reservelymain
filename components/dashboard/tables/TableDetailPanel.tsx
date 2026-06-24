'use client'

import { useState, useEffect } from 'react'
import { RestaurantTable } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X, ImageIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface TableDetailPanelProps {
  table: RestaurantTable | null
  open: boolean
  onClose: () => void
  onUpdated: (updated: RestaurantTable) => void
  onDeleted: (tableId: string) => void
  canManage: boolean
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res((r.result as string).split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export function TableDetailPanel({
  table,
  open,
  onClose,
  onUpdated,
  onDeleted,
  canManage,
}: TableDetailPanelProps) {
  const [name, setName]           = useState('')
  const [capacity, setCapacity]   = useState(1)
  const [category, setCategory]   = useState('')
  const [isActive, setIsActive]   = useState(true)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { lang } = useLang()
  const tx = dashboardT[lang].tableDetail

  useEffect(() => {
    if (table) {
      setName(table.name)
      setCapacity(table.capacity)
      setCategory(table.category)
      setIsActive(table.is_active)
      setConfirmDelete(false)
    }
  }, [table])

  if (!table) return null

  const imageUrls: string[] = table.image_urls ?? []

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/tables/${table!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, capacity, category, is_active: isActive }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Save failed'); return }
      toast.success('Table updated')
      onUpdated(body as RestaurantTable)
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG and WebP images are supported')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image must be under 25 MB')
      return
    }
    setUploading(true)
    try {
      const base64 = await toBase64(file)
      const res = await fetch(`/api/tables/${table!.id}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType: file.type, fileName: file.name }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Upload failed'); return }
      toast.success('Photo added')
      onUpdated({ ...table!, image_urls: body.image_urls })
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveImage(url: string) {
    try {
      const res = await fetch(`/api/tables/${table!.id}/image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlToRemove: url }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Remove failed'); return }
      toast.success('Photo removed')
      onUpdated({ ...table!, image_urls: body.image_urls })
    } catch {
      toast.error('Remove failed')
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/tables/${table!.id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Delete failed'); return }
      toast.success(`Table "${table!.name}" deleted`)
      onDeleted(table!.id)
      onClose()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[440px] flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            <SheetTitle className="text-sm font-semibold text-gray-900">{table.name}</SheetTitle>
            <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{table.category}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${table.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {table.is_active ? tx.active : tx.inactive}
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Details */}
          <section className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{tx.details}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-sm"
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">{tx.capacity}</Label>
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                  className="h-8 text-sm"
                  disabled={!canManage}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">{tx.category}</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-8 text-sm"
                disabled={!canManage}
              />
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="panel-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                <Label htmlFor="panel-is-active" className="text-xs text-gray-700 cursor-pointer">{tx.activeLabel}</Label>
              </div>
            )}
            {canManage && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-8 text-sm bg-brand-primary hover:bg-brand-primary/90 text-white"
              >
                {saving ? tx.saving : tx.saveChanges}
              </Button>
            )}
          </section>

          {/* Photos */}
          <section className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{tx.photos}</p>
            {imageUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={table.name}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {canManage && (
                      <button
                        onClick={() => handleRemoveImage(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove photo"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                <ImageIcon size={20} className="text-zinc-300" />
                <p className="text-xs text-zinc-400">{tx.noPhotos}</p>
              </div>
            )}
            {canManage && (
              <label className="flex items-center justify-center gap-2 cursor-pointer border border-dashed border-zinc-300 rounded-lg py-2.5 hover:border-zinc-400 hover:bg-zinc-50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file)
                    e.target.value = ''
                  }}
                />
                <span className="text-xs text-zinc-500">{uploading ? tx.uploading : tx.addPhoto}</span>
              </label>
            )}
          </section>

          {/* Danger zone */}
          {canManage && (
            <section className="pt-2 border-t border-gray-100">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={12} />
                  {tx.deleteTable}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 font-medium">{tx.confirmDelete(table.name)}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDelete}
                      className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white px-3"
                    >
                      {tx.yesDelete}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmDelete(false)}
                      className="h-8 text-xs px-3"
                    >
                      {tx.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
