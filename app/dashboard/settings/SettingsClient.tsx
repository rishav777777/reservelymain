'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Restaurant } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { OpeningHoursEditor } from '@/components/settings/OpeningHoursEditor'
import {
  Store, BookOpen, Clock, CalendarOff, LayoutGrid,
  ArrowUpRight, Table2, CheckCircle2, Globe, Phone,
  MessageCircle, Bell, CalendarDays, Users,
} from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

/* ─────────────────────── constants ─────────────────────── */

const TIMEZONES = [
  { value: 'Europe/Berlin',  label: 'Berlin / Germany' },
  { value: 'Europe/Vienna',  label: 'Vienna / Austria' },
  { value: 'Europe/Zurich',  label: 'Zurich / Switzerland' },
  { value: 'Europe/London',  label: 'London / UK' },
  { value: 'Europe/Paris',   label: 'Paris / France' },
  { value: 'UTC',            label: 'UTC' },
]

type Tab = 'profile' | 'booking' | 'hours' | 'closures' | 'tables'

/* ─────────────────────── helpers ─────────────────────── */

function SectionCard({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

function FieldRow({ label, hint, children }: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-zinc-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-zinc-400 leading-relaxed">{hint}</p>}
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/* ─────────────────────── component ─────────────────────── */

interface Props {
  restaurant: Restaurant | null
  isOwner?: boolean
}

export function SettingsClient({ restaurant, isOwner = false }: Props) {
  const router = useRouter()
  const { lang } = useLang()
  const tx = dashboardT[lang].settings
  const [tab, setTab] = useState<Tab>('profile')

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile',  label: tx.tabs.profile,  icon: Store },
    { id: 'booking',  label: tx.tabs.booking,  icon: BookOpen },
    { id: 'hours',    label: tx.tabs.hours,    icon: Clock },
    { id: 'closures', label: tx.tabs.closures, icon: CalendarOff },
    { id: 'tables',   label: tx.tabs.tables,   icon: LayoutGrid },
  ]

  const [info, setInfo] = useState({
    name:         restaurant?.name         ?? '',
    description:  restaurant?.description  ?? '',
    cuisine_type: restaurant?.cuisine_type ?? '',
    city:         restaurant?.city         ?? '',
    address:      restaurant?.address      ?? '',
    phone:        restaurant?.phone        ?? '',
    email:        restaurant?.email        ?? '',
    slug:         restaurant?.slug         ?? '',
  })

  const [booking, setBooking] = useState({
    timezone:                  restaurant?.timezone                  ?? 'Europe/Berlin',
    booking_enabled:           restaurant?.booking_enabled           ?? true,
    max_party_size:            restaurant?.max_party_size            ?? 20,
    max_covers_per_slot:       restaurant?.max_covers_per_slot       ?? null as number | null,
    default_duration_minutes:  restaurant?.default_duration_minutes  ?? 90,
  })

  const [whatsapp, setWhatsapp] = useState({
    owner_whatsapp:   restaurant?.owner_whatsapp   ?? '',
    wa_notifications: restaurant?.wa_notifications ?? true,
    wa_daily_summary: restaurant?.wa_daily_summary ?? true,
  })

  const [saving, setSaving]               = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting]           = useState(false)
  const [showDelete, setShowDelete]       = useState(false)

  async function save(patch: Record<string, unknown>) {
    if (!restaurant?.id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Could not save — please try again')
      } else {
        toast.success('Changes saved')
      }
    } catch {
      toast.error('Connection error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Could not delete account')
        return
      }
      router.push('/login')
    } catch {
      toast.error('Connection error')
    } finally {
      setDeleting(false)
    }
  }

  /* ───── render ───── */
  return (
    <div className="min-h-full">

      {/* Page header */}
      <div className="bg-white border-b border-zinc-200 px-8 pt-7 pb-0">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-zinc-900">{tx.title}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {tx.subtitle(restaurant?.name ?? 'your restaurant')}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors duration-100 ${
                tab === id
                  ? 'border-[#E63946] text-[#E63946]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-7 max-w-2xl space-y-5">

        {/* ══════════ Your restaurant ══════════ */}
        {tab === 'profile' && (
          <>
            <SectionCard
              title={tx.profile.detailsTitle}
              description={tx.profile.detailsDesc}
            >
              <FieldRow label={tx.profile.name}>
                <Input
                  value={info.name}
                  onChange={e => setInfo(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Gasthaus zum Löwen"
                  className="h-10"
                />
              </FieldRow>

              <FieldRow
                label={tx.profile.description}
                hint={tx.profile.descHint}
              >
                <Textarea
                  value={info.description}
                  onChange={e => setInfo(p => ({ ...p, description: e.target.value }))}
                  placeholder="Cosy Bavarian kitchen in the heart of Munich…"
                  rows={3}
                  className="resize-none"
                />
              </FieldRow>

              <div className="grid grid-cols-2 gap-4">
                <FieldRow label={tx.profile.cuisineType} hint={tx.profile.cuisineHint}>
                  <Input
                    placeholder="Austrian"
                    value={info.cuisine_type}
                    onChange={e => setInfo(p => ({ ...p, cuisine_type: e.target.value }))}
                    className="h-10"
                  />
                </FieldRow>
                <FieldRow label={tx.profile.city}>
                  <Input
                    placeholder="Vienna"
                    value={info.city}
                    onChange={e => setInfo(p => ({ ...p, city: e.target.value }))}
                    className="h-10"
                  />
                </FieldRow>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldRow label={tx.profile.contactEmail}>
                  <Input
                    type="email"
                    placeholder="info@yourplace.de"
                    value={info.email}
                    onChange={e => setInfo(p => ({ ...p, email: e.target.value }))}
                    className="h-10"
                  />
                </FieldRow>
                <FieldRow label={tx.profile.phone}>
                  <Input
                    type="tel"
                    placeholder="+49 89 12345"
                    value={info.phone}
                    onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))}
                    className="h-10"
                  />
                </FieldRow>
              </div>

              <FieldRow
                label={tx.profile.address}
                hint={tx.profile.addressHint}
              >
                <Input
                  placeholder="Marienplatz 1, 80331 München"
                  value={info.address}
                  onChange={e => setInfo(p => ({ ...p, address: e.target.value }))}
                  className="h-10"
                />
              </FieldRow>

              <Button
                onClick={() => save({ name: info.name, description: info.description, cuisine_type: info.cuisine_type, city: info.city, address: info.address, phone: info.phone, email: info.email })}
                disabled={saving}
                className="bg-[#E63946] hover:bg-[#c1121f] text-white"
              >
                {saving ? tx.saving : tx.profile.saveDetails}
              </Button>
            </SectionCard>

            <SectionCard
              title={tx.profile.linkTitle}
              description={tx.profile.linkDesc}
            >
              <FieldRow
                label={tx.profile.customAddr}
                hint={tx.profile.slugHint}
              >
                <div className="flex items-stretch border border-zinc-200 rounded-lg overflow-hidden h-10 focus-within:ring-2 focus-within:ring-[#E63946]/25 focus-within:border-[#E63946]/50 transition-all">
                  <span className="flex items-center px-3 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200 select-none shrink-0">
                    reservely.app/book/
                  </span>
                  <input
                    value={info.slug}
                    onChange={e => setInfo(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="flex-1 px-3 text-sm text-zinc-900 focus:outline-none bg-white font-mono"
                    placeholder="your-restaurant"
                  />
                </div>
              </FieldRow>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => save({ slug: info.slug })}
                  disabled={saving}
                  className="bg-[#E63946] hover:bg-[#c1121f] text-white"
                >
                  {saving ? tx.saving : tx.profile.updateLink}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/book/${info.slug}`)
                    toast.success(tx.closeAccount.linkCopied)
                  }}
                  className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  {tx.profile.copyLink}
                </button>
              </div>
            </SectionCard>

            <SectionCard title={tx.profile.locTitle} description={tx.profile.locDesc}>
              <div className="max-w-xs">
                <FieldRow
                  label={tx.profile.timezone}
                  hint={tx.profile.tzHint}
                >
                  <select
                    value={booking.timezone}
                    onChange={e => setBooking(p => ({ ...p, timezone: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#E63946]/25"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </FieldRow>
              </div>
              <Button
                onClick={() => save({ timezone: booking.timezone })}
                disabled={saving}
                className="bg-[#E63946] hover:bg-[#c1121f] text-white"
              >
                {saving ? tx.saving : tx.profile.saveTz}
              </Button>
            </SectionCard>
          </>
        )}

        {/* ══════════ Booking settings ══════════ */}
        {tab === 'booking' && (
          <>
            <SectionCard title={tx.booking.howTitle} description={tx.booking.howDesc}>
              <ToggleRow
                label={tx.booking.acceptOnline}
                description={tx.booking.acceptDesc}
                checked={booking.booking_enabled}
                onChange={v => setBooking(p => ({ ...p, booking_enabled: v }))}
              />

              <div className="border-t border-zinc-100" />

              <FieldRow
                label={tx.booking.maxParty}
                hint={tx.booking.maxPartyHint}
              >
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={booking.max_party_size}
                    onChange={e => setBooking(p => ({ ...p, max_party_size: Number(e.target.value) }))}
                    className="h-10 w-24 text-center text-base font-semibold"
                  />
                  <span className="text-sm text-zinc-400">{tx.booking.people}</span>
                </div>
              </FieldRow>

              <div className="border-t border-zinc-100" />

              <FieldRow
                label="Max covers per time slot"
                hint="Limits the total number of guests that can book in the same time slot. Leave blank for no limit."
              >
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    placeholder="No limit"
                    value={booking.max_covers_per_slot ?? ''}
                    onChange={e => setBooking(p => ({ ...p, max_covers_per_slot: e.target.value ? Number(e.target.value) : null }))}
                    className="h-10 w-24 text-center text-base font-semibold"
                  />
                  <span className="text-sm text-zinc-400">covers / slot</span>
                </div>
              </FieldRow>

              <FieldRow
                label="Default reservation duration"
                hint="How long a table is reserved by default. Used to estimate departure time for guests."
              >
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={30}
                    max={360}
                    step={15}
                    value={booking.default_duration_minutes}
                    onChange={e => setBooking(p => ({ ...p, default_duration_minutes: Number(e.target.value) }))}
                    className="h-10 w-24 text-center text-base font-semibold"
                  />
                  <span className="text-sm text-zinc-400">minutes</span>
                </div>
              </FieldRow>

              <Button
                onClick={() => save({
                  booking_enabled: booking.booking_enabled,
                  max_party_size: booking.max_party_size,
                  max_covers_per_slot: booking.max_covers_per_slot,
                  default_duration_minutes: booking.default_duration_minutes,
                })}
                disabled={saving}
                className="bg-[#E63946] hover:bg-[#c1121f] text-white"
              >
                {saving ? tx.saving : tx.booking.saveSettings}
              </Button>
            </SectionCard>

            <SectionCard
              title={tx.booking.waTitle}
              description={tx.booking.waDesc}
            >
              {/* Coming-soon notice — remove once Meta Business Account is approved */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 flex gap-3 items-start">
                <span className="text-amber-500 mt-0.5 shrink-0">⏳</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    {lang === 'DE' ? 'WhatsApp — kommt bald' : 'WhatsApp — coming soon'}
                  </p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    {lang === 'DE'
                      ? 'Die WhatsApp-Integration wartet auf die Genehmigung des Meta Business Accounts (3–7 Werktage). Sobald die Genehmigung vorliegt, wird diese Funktion hier freigeschaltet.'
                      : 'WhatsApp integration is pending Meta Business Account approval (3–7 business days). Once approved, this feature will be enabled here automatically.'}
                  </p>
                </div>
              </div>

              <div className="opacity-40 pointer-events-none select-none">
                <FieldRow
                  label={tx.booking.waNumber}
                  hint={tx.booking.waHint}
                >
                  <div className="relative max-w-xs">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      type="tel"
                      placeholder="+49 151 12345678"
                      value={whatsapp.owner_whatsapp}
                      onChange={e => setWhatsapp(p => ({ ...p, owner_whatsapp: e.target.value }))}
                      className="h-10 pl-9"
                    />
                  </div>
                </FieldRow>

                <div className="border-t border-zinc-100" />

                <ToggleRow
                  label={tx.booking.instantTitle}
                  description={tx.booking.instantDesc}
                  checked={whatsapp.wa_notifications}
                  onChange={v => setWhatsapp(p => ({ ...p, wa_notifications: v }))}
                />

                <ToggleRow
                  label={tx.booking.morningTitle}
                  description={tx.booking.morningDesc}
                  checked={whatsapp.wa_daily_summary}
                  onChange={v => setWhatsapp(p => ({ ...p, wa_daily_summary: v }))}
                />
              </div>
            </SectionCard>
          </>
        )}

        {/* ══════════ Opening hours ══════════ */}
        {tab === 'hours' && (
          <SectionCard title={tx.hours.title} description={tx.hours.desc}>
            {restaurant?.id
              ? <OpeningHoursEditor restaurantId={restaurant.id} />
              : <p className="text-sm text-zinc-400">{tx.noRestaurant}</p>
            }
          </SectionCard>
        )}

        {/* ══════════ Holidays ══════════ */}
        {tab === 'closures' && (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-14 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <CalendarOff className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">{tx.closures.title}</p>
            <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {tx.closures.desc}
            </p>
          </div>
        )}

        {/* ══════════ Tables ══════════ */}
        {tab === 'tables' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500 leading-relaxed">
              {tx.tables.desc}
            </p>

            <Link
              href="/dashboard/layout-editor"
              className="group flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-5 hover:border-[#E63946]/30 hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-zinc-100 group-hover:bg-[#E63946]/10 flex items-center justify-center transition-colors shrink-0">
                <LayoutGrid className="w-5 h-5 text-zinc-400 group-hover:text-[#E63946] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{tx.tables.floorPlan}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{tx.tables.floorPlanDesc}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
            </Link>

            <Link
              href="/dashboard/tables"
              className="group flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-5 hover:border-[#E63946]/30 hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-zinc-100 group-hover:bg-[#E63946]/10 flex items-center justify-center transition-colors shrink-0">
                <Table2 className="w-5 h-5 text-zinc-400 group-hover:text-[#E63946] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{tx.tables.tableList}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{tx.tables.tableListDesc}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
            </Link>
          </div>
        )}

        {/* ══════════ Always-visible bottom actions ══════════ */}
        <div className="mt-10 pt-6 border-t border-zinc-200 space-y-6">
          <div>
            <p className="text-sm font-semibold text-zinc-700 mb-1">{tx.data.title}</p>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              {tx.data.desc}
            </p>
            <a
              href="/api/export"
              download
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg px-4 py-2 hover:bg-zinc-50 transition-colors"
            >
              {tx.data.download}
            </a>
          </div>

          {isOwner && (
            <div>
              <p className="text-sm font-semibold text-red-500 mb-1">{tx.closeAccount.title}</p>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                {tx.closeAccount.desc}
              </p>
              {!showDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="text-sm font-medium text-red-500 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
                >
                  {tx.closeAccount.button}
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4 max-w-sm">
                  <p className="text-xs font-semibold text-red-700">
                    {tx.closeAccount.warning}
                  </p>
                  <FieldRow label={<span>Type <span className="font-mono font-black">DELETE</span> to confirm</span> as unknown as string}>
                    <Input
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="DELETE"
                      className="h-9 font-mono border-red-300"
                    />
                  </FieldRow>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                      className="text-xs text-zinc-600 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-white transition-colors"
                    >
                      {tx.closeAccount.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== 'DELETE' || deleting}
                      className="text-xs font-medium text-white bg-red-600 rounded-lg px-3 py-1.5 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {deleting ? tx.closeAccount.closing : tx.closeAccount.confirm}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
