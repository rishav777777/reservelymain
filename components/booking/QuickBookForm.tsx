'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, Clock, Users, User, Mail, Phone, ChevronDown, Check } from 'lucide-react'

interface Props {
  restaurantId:     string
  restaurantName:   string
  advanceBookingDays: number
  maxPartySize:     number
  defaultDuration:  number
  openingHoursMap:  Record<number, { open: string; last: string | null }>
  closedDows:       Set<number>
  demoMode?:        boolean   // skips DB insert — used on landing page
}

// Day of week: 0=Mon … 6=Sun (same convention as Screen1)
function getDow(year: number, month: number, day: number): number {
  return (new Date(year, month - 1, day).getDay() + 6) % 7
}

function generateTimes(open: string, last: string): string[] {
  const slots: string[] = []
  const [oh, om] = open.split(':').map(Number)
  const [lh, lm] = last.split(':').map(Number)
  let cur = oh * 60 + om
  const end = lh * 60 + lm
  while (cur <= end) {
    slots.push(
      `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`
    )
    cur += 30
  }
  return slots
}

const DEFAULT_TIMES = [
  '11:00','11:30','12:00','12:30','13:00','13:30',
  '17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30',
]

function toISODate(date: Date): string {
  const y  = date.getFullYear()
  const m  = String(date.getMonth() + 1).padStart(2, '0')
  const d  = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function QuickBookForm({
  restaurantId,
  restaurantName,
  advanceBookingDays,
  maxPartySize,
  defaultDuration,
  openingHoursMap,
  closedDows,
  demoMode = false,
}: Props) {
  const today   = toISODate(new Date())
  const maxDate = toISODate(new Date(Date.now() + advanceBookingDays * 86_400_000))

  const [date,    setDate]    = useState(today)
  const [time,    setTime]    = useState('')
  const [guests,  setGuests]  = useState(2)
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [notes,   setNotes]   = useState('')
  const [consent, setConsent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [done,    setDone]    = useState<string | null>(null)   // reference code

  // Available time slots based on selected date
  const availableTimes = useMemo(() => {
    if (!date) return DEFAULT_TIMES
    const d = parseDate(date)
    const dow = getDow(d.getFullYear(), d.getMonth() + 1, d.getDate())
    if (closedDows.has(dow)) return []
    const h = openingHoursMap[dow]
    if (h?.open && h?.last) return generateTimes(h.open, h.last)
    return DEFAULT_TIMES
  }, [date, openingHoursMap, closedDows])

  const isDateClosed = useMemo(() => {
    if (!date) return false
    const d = parseDate(date)
    return closedDows.has(getDow(d.getFullYear(), d.getMonth() + 1, d.getDate()))
  }, [date, closedDows])

  // Reset time if it's no longer in the available slots
  const safeTime = availableTimes.includes(time) ? time : (availableTimes[0] ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { setError('Please accept the privacy consent.'); return }
    if (!date || !safeTime || !name.trim() || !email.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (isDateClosed) { setError('The restaurant is closed on that day.'); return }

    setSending(true)
    setError(null)

    const refCode = 'RSV-' + Math.random().toString(36).toUpperCase().slice(2, 8)

    if (demoMode) {
      // Demo: simulate a short network delay then show success without touching the DB
      await new Promise((r) => setTimeout(r, 800))
      setSending(false)
      setDone(refCode)
      return
    }

    const supabase = createClient()
    const { error: dbErr } = await supabase.from('reservations').insert({
      restaurant_id:    restaurantId,
      reference_code:   refCode,
      guest_name:       name.trim(),
      guest_email:      email.trim(),
      guest_phone:      phone.trim() || null,
      party_size:       guests,
      reservation_date: date,
      reservation_time: safeTime,
      duration_minutes: defaultDuration,
      status:           'pending',
      source:           'quick_book',
      special_requests: notes.trim() || null,
      guest_consented:  true,
      consented_at:     new Date().toISOString(),
    })

    setSending(false)

    if (dbErr) {
      setError('Something went wrong. Please try again.')
      return
    }

    setDone(refCode)
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={PAGE}>
        <div style={CARD}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Check size={24} color="#2E7D32" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', textAlign: 'center', marginBottom: 8 }}>
            {demoMode ? 'Demo complete!' : 'Request received!'}
          </h2>
          <p style={{ fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 1.6, marginBottom: 16 }}>
            {demoMode
              ? 'This was a demo — no reservation was saved. Your guests see exactly this flow when they book for real.'
              : `${restaurantName} will confirm your reservation shortly. Check your email for updates.`}
          </p>
          <div style={{ background: '#F5F5F5', borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
              {demoMode ? 'Example reference code' : 'Your reference code'}
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: 2 }}>{done}</p>
          </div>
          {demoMode && (
            <a
              href="/login"
              style={{ display: 'block', marginTop: 20, background: '#0D472B', color: '#FFF', textAlign: 'center', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Set up your restaurant →
            </a>
          )}
        </div>
      </div>
    )
  }

  // ── Booking form ─────────────────────────────────────────────────────────
  return (
    <div style={PAGE}>
      <div style={CARD}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Online Reservation</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>{restaurantName}</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Date */}
          <div>
            <label style={LABEL}><CalendarDays size={12} style={{ display: 'inline', marginRight: 4 }} />Date *</label>
            <input
              type="date"
              value={date}
              min={today}
              max={maxDate}
              onChange={(e) => { setDate(e.target.value); setTime('') }}
              required
              style={INPUT}
            />
            {isDateClosed && (
              <p style={{ fontSize: 11, color: '#c0392b', marginTop: 4 }}>
                The restaurant is closed on this day.
              </p>
            )}
          </div>

          {/* Time */}
          <div>
            <label style={LABEL}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Time *</label>
            <div style={{ position: 'relative' }}>
              <select
                value={safeTime}
                onChange={(e) => setTime(e.target.value)}
                required
                disabled={isDateClosed || availableTimes.length === 0}
                style={{ ...INPUT, appearance: 'none', paddingRight: 36 }}
              >
                {availableTimes.length === 0 ? (
                  <option value="">No times available</option>
                ) : (
                  availableTimes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))
                )}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Party size */}
          <div>
            <label style={LABEL}><Users size={12} style={{ display: 'inline', marginRight: 4 }} />Number of guests *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: Math.min(maxPartySize, 10) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGuests(n)}
                  style={{
                    width: 40, height: 40, borderRadius: 8, border: '1.5px solid',
                    borderColor: guests === n ? '#0D472B' : '#DDD',
                    background: guests === n ? '#0D472B' : '#FFF',
                    color: guests === n ? '#FFF' : '#333',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
              {maxPartySize > 10 && (
                <div style={{ position: 'relative', flex: 1, minWidth: 80 }}>
                  <select
                    value={guests > 10 ? guests : ''}
                    onChange={(e) => e.target.value && setGuests(Number(e.target.value))}
                    style={{ ...INPUT, appearance: 'none', paddingRight: 32, height: 40, padding: '0 32px 0 12px' }}
                  >
                    <option value="">11+</option>
                    {Array.from({ length: maxPartySize - 10 }, (_, i) => i + 11).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#EEE', margin: '4px 0' }} />

          {/* Guest details */}
          <div>
            <label style={LABEL}><User size={12} style={{ display: 'inline', marginRight: 4 }} />Full name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria Muster" required style={INPUT} />
          </div>
          <div>
            <label style={LABEL}><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />Email address *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@example.com" required style={INPUT} />
          </div>
          <div>
            <label style={LABEL}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Phone number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+43 660 123 4567" style={INPUT} />
          </div>
          <div>
            <label style={LABEL}>Special requests (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, high chairs, birthday celebration…"
              rows={3}
              style={{ ...INPUT, height: 'auto', resize: 'vertical' }}
            />
          </div>

          {/* GDPR consent */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              style={{ marginTop: 2, width: 16, height: 16, accentColor: '#0D472B', flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>
              I consent to {restaurantName} storing my contact details to process this reservation.
              Data is deleted after your visit per GDPR.
            </span>
          </label>

          {error && (
            <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#C62828' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={sending || isDateClosed || availableTimes.length === 0}
            style={{
              background: sending ? '#777' : '#0D472B',
              color: '#FFF',
              border: 'none',
              borderRadius: 10,
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 700,
              cursor: sending ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {sending ? 'Sending…' : 'Request Reservation'}
          </button>

          <p style={{ fontSize: 11, color: '#999', textAlign: 'center', lineHeight: 1.5 }}>
            This is a reservation request. {restaurantName} will send you a confirmation.
          </p>
        </form>
      </div>
    </div>
  )
}

const PAGE: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#F4F6F4',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '32px 16px 80px',
  fontFamily: "'DM Sans', system-ui, sans-serif",
}

const CARD: React.CSSProperties = {
  background: '#FFF',
  borderRadius: 20,
  padding: '28px 24px',
  width: '100%',
  maxWidth: 420,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#333',
  marginBottom: 6,
}

const INPUT: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  color: '#111',
  background: '#F9F9F9',
  border: '1.5px solid #E0E0E0',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
}
