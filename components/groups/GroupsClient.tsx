'use client'

import { useState } from 'react'
import { GroupBooking } from '@/types'
import { Users, Calendar, Clock, ChevronDown, ChevronUp, Check, X, CheckCircle2, Ban } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const STATUS_CLS: Record<GroupBooking['status'], string> = {
  inquiry:   'bg-amber-50  text-amber-700  border-amber-200',
  confirmed: 'bg-green-50  text-green-700  border-green-200',
  cancelled: 'bg-red-50    text-red-700    border-red-200',
  completed: 'bg-gray-100  text-gray-500   border-gray-200',
}

function formatDate(d: string, locale: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function GroupsClient({ initialGroups }: { initialGroups: GroupBooking[] }) {
  const { lang } = useLang()
  const tx = dashboardT[lang].groups

  const [groups, setGroups]     = useState<GroupBooking[]>(initialGroups)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving]     = useState<string | null>(null)
  const [notes, setNotes]       = useState<Record<string, string>>({})

  async function updateStatus(id: string, status: GroupBooking['status']) {
    setSaving(id)
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) return
      setGroups(prev => prev.map(g => g.id === id ? { ...g, status } : g))
    } finally {
      setSaving(null)
    }
  }

  async function saveNotes(id: string) {
    if (notes[id] === undefined) return
    setSaving(id)
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes[id] }),
      })
      if (!res.ok) return
      setGroups(prev => prev.map(g => g.id === id ? { ...g, notes: notes[id] } : g))
    } finally {
      setSaving(null)
    }
  }

  const inquiries  = groups.filter(g => g.status === 'inquiry')
  const confirmed  = groups.filter(g => g.status === 'confirmed')
  const archived   = groups.filter(g => g.status === 'cancelled' || g.status === 'completed')

  return (
    <div className="p-5 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{tx.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{tx.subtitle}</p>
      </div>

      {groups.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center">
          <Users size={28} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-700">{tx.empty.title}</p>
          <p className="text-xs text-gray-400 mt-1">{tx.empty.subtitle}</p>
        </div>
      )}

      {inquiries.length > 0 && (
        <Section title={tx.section.needsAttention(inquiries.length)} accent="amber">
          {inquiries.map(g => (
            <GroupCard
              key={g.id}
              group={g}
              expanded={expanded === g.id}
              saving={saving === g.id}
              noteValue={notes[g.id] ?? g.notes ?? ''}

              onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
              onNoteChange={v => setNotes(n => ({ ...n, [g.id]: v }))}
              onSaveNotes={() => saveNotes(g.id)}
              onConfirm={() => updateStatus(g.id, 'confirmed')}
              onDecline={() => updateStatus(g.id, 'cancelled')}
            />
          ))}
        </Section>
      )}

      {confirmed.length > 0 && (
        <Section title={tx.section.confirmed(confirmed.length)} accent="green">
          {confirmed.map(g => (
            <GroupCard
              key={g.id}
              group={g}
              expanded={expanded === g.id}
              saving={saving === g.id}
              noteValue={notes[g.id] ?? g.notes ?? ''}

              onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
              onNoteChange={v => setNotes(n => ({ ...n, [g.id]: v }))}
              onSaveNotes={() => saveNotes(g.id)}
              onComplete={() => updateStatus(g.id, 'completed')}
              onDecline={() => updateStatus(g.id, 'cancelled')}
            />
          ))}
        </Section>
      )}

      {archived.length > 0 && (
        <Section title={tx.section.archived(archived.length)} accent="gray">
          {archived.map(g => (
            <GroupCard
              key={g.id}
              group={g}
              expanded={expanded === g.id}
              saving={saving === g.id}
              noteValue={notes[g.id] ?? g.notes ?? ''}

              onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
              onNoteChange={v => setNotes(n => ({ ...n, [g.id]: v }))}
              onSaveNotes={() => saveNotes(g.id)}
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  accent,
  children,
}: {
  title: string
  accent: 'amber' | 'green' | 'gray'
  children: React.ReactNode
}) {
  const dotCls =
    accent === 'amber' ? 'bg-amber-400' :
    accent === 'green' ? 'bg-green-400' :
    'bg-gray-300'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function GroupCard({
  group,
  expanded,
  saving,
  noteValue,
  onToggle,
  onNoteChange,
  onSaveNotes,
  onConfirm,
  onDecline,
  onComplete,
}: {
  group:       GroupBooking
  expanded:    boolean
  saving:      boolean
  noteValue:   string
  onToggle:    () => void
  onNoteChange:(v: string) => void
  onSaveNotes: () => void
  onConfirm?:  () => void
  onDecline?:  () => void
  onComplete?: () => void
}) {
  const { lang } = useLang()
  const tx = dashboardT[lang].groups
  const locale = lang === 'EN' ? 'en-GB' : 'de-DE'
  const statusLabel = tx.status[group.status]
  const statusCls   = STATUS_CLS[group.status]

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {group.group_name ?? group.organizer_name}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${statusCls}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={11} />
              {formatDate(group.event_date, locale)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={11} />
              {group.start_time.slice(0, 5)}{group.end_time ? ` – ${group.end_time.slice(0, 5)}` : ''}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={11} />
              {group.party_size} {tx.guests}
            </span>
            {group.menu_type && (
              <span className="text-xs text-gray-400">
                {(tx.menu as Record<string, string>)[group.menu_type]}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-gray-400 mt-1 shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-gray-400 mt-1 shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Organizer */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-400 mb-0.5">{tx.detail.organizer}</p>
              <p className="text-gray-800 font-medium">{group.organizer_name}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">{tx.detail.email}</p>
              <a href={`mailto:${group.organizer_email}`} className="text-[#E63946] hover:underline break-all">
                {group.organizer_email}
              </a>
            </div>
            {group.organizer_phone && (
              <div>
                <p className="text-gray-400 mb-0.5">{tx.detail.phone}</p>
                <a href={`tel:${group.organizer_phone}`} className="text-gray-800 hover:underline">
                  {group.organizer_phone}
                </a>
              </div>
            )}
            {group.special_requests && (
              <div className="col-span-2">
                <p className="text-gray-400 mb-0.5">{tx.detail.specialRequests}</p>
                <p className="text-gray-700 leading-relaxed">{group.special_requests}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">{tx.detail.notes}</p>
            <textarea
              value={noteValue}
              onChange={e => onNoteChange(e.target.value)}
              placeholder={tx.detail.notesPh}
              rows={3}
              className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#E63946]/40 focus:border-[#E63946]/60"
            />
            <button
              onClick={onSaveNotes}
              disabled={saving}
              className="mt-1.5 text-xs text-[#E63946] hover:underline disabled:opacity-40"
            >
              {saving ? tx.detail.saving : tx.detail.saveNotes}
            </button>
          </div>

          {/* Actions */}
          {(onConfirm || onDecline || onComplete) && (
            <div className="flex items-center gap-2 pt-1">
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-40 transition-colors"
                >
                  <Check size={12} />
                  {tx.detail.confirmInquiry}
                </button>
              )}
              {onComplete && (
                <button
                  onClick={onComplete}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-40 transition-colors"
                >
                  <CheckCircle2 size={12} />
                  {tx.detail.markCompleted}
                </button>
              )}
              {onDecline && (
                <button
                  onClick={onDecline}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 disabled:opacity-40 transition-colors"
                >
                  <Ban size={12} />
                  {tx.detail.cancel}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
