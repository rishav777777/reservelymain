'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Restaurant } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { OpeningHoursEditor } from '@/components/settings/OpeningHoursEditor'
import { toast } from 'sonner'
import { CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'

const STEPS = ['Restaurant', 'WhatsApp', 'Hours', 'Done'] as const
type Step = 0 | 1 | 2 | 3

interface Props {
  restaurant: Restaurant | null
}

export function SetupWizard({ restaurant }: Props) {
  const router = useRouter()
  const id = restaurant?.id ?? ''

  const [step, setStep] = useState<Step>(0)
  const [saving, setSaving] = useState(false)

  const [info, setInfo] = useState({
    name:    restaurant?.name    ?? '',
    address: restaurant?.address ?? '',
    phone:   restaurant?.phone   ?? '',
    email:   restaurant?.email   ?? '',
  })

  const [wa, setWa] = useState({
    owner_whatsapp:   restaurant?.owner_whatsapp   ?? '',
    wa_notifications: restaurant?.wa_notifications ?? true,
    wa_daily_summary: restaurant?.wa_daily_summary ?? true,
  })

  async function patch(data: Record<string, unknown>) {
    const res = await fetch(`/api/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error)
    }
  }

  async function handleInfoNext(e: React.FormEvent) {
    e.preventDefault()
    if (!info.name.trim()) { toast.error('Restaurant name is required'); return }
    setSaving(true)
    try {
      await patch(info)
      setStep(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleWaNext(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await patch(wa)
      setStep(2)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await patch({ setup_completed: true })
      setStep(3)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress bar */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
              i < step
                ? 'bg-[#E63946] text-white'
                : i === step
                ? 'bg-white text-[#0F172A]'
                : 'bg-white/10 text-white/40'
            }`}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${
              i === step ? 'text-white' : 'text-white/40'
            }`}>{label}</span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px ${i < step ? 'bg-[#E63946]' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">

        {/* ── Step 0: Restaurant Info ── */}
        {step === 0 && (
          <form onSubmit={handleInfoNext} className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Set up your restaurant</h2>
              <p className="text-xs text-gray-400 mt-1">This takes about 2 minutes.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Restaurant name <span className="text-[#E63946]">*</span></Label>
              <Input
                value={info.name}
                onChange={(e) => setInfo(p => ({ ...p, name: e.target.value }))}
                placeholder="Zum Goldenen Löwen"
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Address</Label>
              <Input
                value={info.address}
                onChange={(e) => setInfo(p => ({ ...p, address: e.target.value }))}
                placeholder="Marienplatz 1, 80331 München"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Phone</Label>
                <Input
                  value={info.phone}
                  onChange={(e) => setInfo(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+49 89 12345678"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={info.email}
                  onChange={(e) => setInfo(p => ({ ...p, email: e.target.value }))}
                  placeholder="info@restaurant.de"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-sm bg-[#E63946] hover:bg-[#c1121f] text-white"
              disabled={saving}
            >
              {saving ? 'Saving...' : <>Save & Continue <ChevronRight size={14} className="ml-1" /></>}
            </Button>
          </form>
        )}

        {/* ── Step 1: WhatsApp ── */}
        {step === 1 && (
          <form onSubmit={handleWaNext} className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">WhatsApp notifications</h2>
              <p className="text-xs text-gray-400 mt-1">Get reservation alerts on your phone. You can skip this and add it later in Settings.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Your WhatsApp number</Label>
              <Input
                type="tel"
                value={wa.owner_whatsapp}
                onChange={(e) => setWa(p => ({ ...p, owner_whatsapp: e.target.value }))}
                placeholder="+49 151 12345678"
                className="h-9 text-sm"
              />
              <p className="text-xs text-gray-400">Include country code e.g. +49</p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-700">New reservation alerts</p>
                  <p className="text-xs text-gray-400">Notify me for every new booking</p>
                </div>
                <Switch
                  checked={wa.wa_notifications}
                  onCheckedChange={(v) => setWa(p => ({ ...p, wa_notifications: v }))}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-medium text-gray-700">Daily morning summary</p>
                  <p className="text-xs text-gray-400">Overview of today's bookings at 08:00</p>
                </div>
                <Switch
                  checked={wa.wa_daily_summary}
                  onCheckedChange={(v) => setWa(p => ({ ...p, wa_daily_summary: v }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-9 text-sm"
                onClick={() => setStep(0)}
              >
                <ChevronLeft size={14} className="mr-1" /> Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 text-sm bg-[#E63946] hover:bg-[#c1121f] text-white"
                disabled={saving}
              >
                {saving ? 'Saving...' : <>Save & Continue <ChevronRight size={14} className="ml-1" /></>}
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 2: Opening Hours ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Opening hours</h2>
              <p className="text-xs text-gray-400 mt-1">Set your weekly schedule. Toggle a day off to mark it as closed.</p>
            </div>

            {id && <OpeningHoursEditor restaurantId={id} />}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-9 text-sm"
                onClick={() => setStep(1)}
              >
                <ChevronLeft size={14} className="mr-1" /> Back
              </Button>
              <Button
                className="flex-1 h-9 text-sm bg-[#E63946] hover:bg-[#c1121f] text-white"
                onClick={handleFinish}
                disabled={saving}
              >
                {saving ? 'Finishing...' : <>Finish Setup <ChevronRight size={14} className="ml-1" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">You're all set!</h2>
              <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
                Your restaurant is configured. You can update any of these settings later from the Settings page.
              </p>
            </div>
            <Button
              className="w-full h-9 text-sm bg-[#E63946] hover:bg-[#c1121f] text-white"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
