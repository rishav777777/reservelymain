'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Users, Calendar, Clock, ChefHat, MessageSquare,
  User, Phone, Mail, PartyPopper, ChevronLeft, CheckCircle2,
  ArrowLeft, Building2,
} from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { groupBookingT } from '@/lib/i18n/translations'

interface PublicRestaurant {
  id:   string
  name: string
  slug: string
  city: string | null
  cuisine_type: string | null
}

type MenuType = 'set_menu' | 'a_la_carte' | 'buffet'

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(40px) saturate(160%)',
  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: '22px',
}

const FIELD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: '14px',
  padding: '13px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const INPUT: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans, sans-serif)',
  fontSize: '14px',
  color: '#fff',
  width: '100%',
}

type Step = 'restaurant' | 'event' | 'contact' | 'done'

export default function GroupBookingPage() {
  const { lang } = useLang()
  const tx = groupBookingT[lang]

  const [step,        setStep]        = useState<Step>('restaurant')
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([])
  const [loadingR,    setLoadingR]    = useState(true)
  const [query,       setQuery]       = useState('')

  const [selectedR,   setSelectedR]   = useState<PublicRestaurant | null>(null)
  const [eventType,   setEventType]   = useState('')
  const [groupName,   setGroupName]   = useState('')
  const [partySize,   setPartySize]   = useState(10)
  const [eventDate,   setEventDate]   = useState('')
  const [startTime,   setStartTime]   = useState('')
  const [endTime,     setEndTime]     = useState('')
  const [menuType,    setMenuType]    = useState<MenuType | ''>('')
  const [requests,    setRequests]    = useState('')
  const [orgName,     setOrgName]     = useState('')
  const [orgEmail,    setOrgEmail]    = useState('')
  const [orgPhone,    setOrgPhone]    = useState('')
  const [consented,   setConsented]   = useState(false)
  const [sending,     setSending]     = useState(false)
  const [submitErr,   setSubmitErr]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/restaurants/public')
      .then(r => r.json())
      .then(d => setRestaurants(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingR(false))
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return restaurants
    const q = query.toLowerCase()
    return restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.city?.toLowerCase().includes(q) ?? false) ||
      (r.cuisine_type?.toLowerCase().includes(q) ?? false)
    )
  }, [restaurants, query])

  const today = new Date().toISOString().split('T')[0]
  const canSubmit = orgName.trim() && orgEmail.trim() && partySize >= 1 && eventDate && startTime && consented

  async function handleSubmit() {
    if (!canSubmit || !selectedR || sending) return
    setSending(true)
    setSubmitErr(null)
    try {
      const res = await fetch('/api/groups', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id:    selectedR.id,
          organizer_name:   orgName.trim(),
          organizer_email:  orgEmail.trim(),
          organizer_phone:  orgPhone.trim() || null,
          group_name:       (groupName.trim() || eventType) || null,
          party_size:       partySize,
          event_date:       eventDate,
          start_time:       startTime,
          end_time:         endTime || null,
          menu_type:        menuType || null,
          special_requests: requests.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitErr(data.error ?? 'Something went wrong'); setSending(false); return }
      setStep('done')
    } catch {
      setSubmitErr(tx.error)
      setSending(false)
    }
  }

  const STEPS = tx.steps
  const stepIdx = STEPS.indexOf(step as 'restaurant' | 'event' | 'contact')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg, #071a0e 0%, #0D472B 45%, #0a3020 100%)',
      position: 'relative',
      fontFamily: 'var(--font-dm-sans, sans-serif)',
    }}>
      <style>{`
        .gb-dot-bg::before {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);
          background-size:24px 24px;
        }
        .gb-orb1 {
          position:fixed; top:-160px; right:-100px;
          width:400px; height:400px; border-radius:50%;
          background:radial-gradient(circle at 50%,rgba(251,191,36,0.08) 0%,transparent 70%);
          pointer-events:none; z-index:0;
        }
        .gb-shell {
          position:relative; z-index:1;
          min-height:100vh; display:flex; flex-direction:column; align-items:center;
          padding:0 16px 56px;
          overflow-y:auto; overflow-x:hidden; scrollbar-width:none;
        }
        .gb-shell::-webkit-scrollbar{display:none}
        .gb-content { width:100%; max-width:520px; display:flex; flex-direction:column; }
        @keyframes gb-spin { to{transform:rotate(360deg)} }
        .gb-field:focus-within { border-color:rgba(251,191,36,0.30) !important; }
        ::placeholder { color:rgba(255,255,255,0.25) !important; }
      `}</style>

      <div className="gb-dot-bg" />
      <div className="gb-orb1" />

      <div className="gb-shell">
        <div className="gb-content">

          {/* ── TOP NAV ──────────────────────────────────────────────── */}
          <div style={{ paddingTop: '28px', paddingBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.40)', textDecoration: 'none', fontSize: '12px' }}>
              <ArrowLeft size={14} /> {tx.nav.back}
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PartyPopper size={14} color="rgba(251,191,36,0.70)" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(251,191,36,0.70)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {tx.badge}
              </span>
            </div>
          </div>

          {/* ── HEADER ───────────────────────────────────────────────── */}
          {step !== 'done' && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontFamily: 'var(--font-dm-serif, serif)', fontSize: '26px', color: '#fff', margin: '0 0 6px' }}>
                {tx.stepHeaders[step as 'restaurant' | 'event' | 'contact'].title}
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>
                {tx.stepHeaders[step as 'restaurant' | 'event' | 'contact'].subtitle}
              </p>
            </div>
          )}

          {/* ── STEP INDICATOR ───────────────────────────────────────── */}
          {step !== 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', justifyContent: 'center' }}>
              {STEPS.map((s, i) => {
                const done   = i < stepIdx
                const active = i === stepIdx
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: active ? '28px' : '22px', height: '6px', borderRadius: '100px',
                      background: done || active
                        ? 'linear-gradient(90deg, #FCD34D, #F59E0B)'
                        : 'rgba(255,255,255,0.10)',
                      transition: 'all .25s ease',
                      boxShadow: active ? '0 0 8px rgba(252,211,77,0.45)' : 'none',
                    }} />
                    {i < STEPS.length - 1 && (
                      <div style={{ width: '16px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ══ STEP 1: RESTAURANT ════════════════════════════════════ */}
          {step === 'restaurant' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ ...FIELD, padding: '12px 16px' }}>
                <Search size={15} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={tx.search}
                  style={INPUT}
                />
              </div>

              {loadingR ? (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid rgba(252,211,77,0.20)', borderTopColor: '#FCD34D', animation: 'gb-spin 0.75s linear infinite' }} />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
                  {tx.noResults}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filtered.map(r => (
                    <button key={r.id} onClick={() => { setSelectedR(r); setStep('event') }}
                      style={{
                        ...CARD,
                        padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'border-color .15s, background .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(252,211,77,0.30)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)')}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(13,71,43,0.6), rgba(5,150,105,0.4))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Building2 size={16} color="rgba(52,211,153,0.70)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{r.name}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
                          {[r.city, r.cuisine_type].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <ChevronLeft size={14} color="rgba(255,255,255,0.20)" style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 2: EVENT DETAILS ════════════════════════════════ */}
          {step === 'event' && selectedR && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ ...CARD, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={14} color="rgba(52,211,153,0.70)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600, flex: 1 }}>{selectedR.name}</span>
                <button onClick={() => setStep('restaurant')}
                  style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {tx.change}
                </button>
              </div>

              {/* Event type chips */}
              <div style={CARD}>
                <div style={{ padding: '16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
                    {tx.eventType}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tx.eventTypes.map(({ emoji, label }) => {
                      const active = eventType === label
                      return (
                        <button key={label} onClick={() => setEventType(active ? '' : label)} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '7px 12px', borderRadius: '100px',
                          background: active ? 'rgba(252,211,77,0.15)' : 'rgba(255,255,255,0.05)',
                          border: active ? '1px solid rgba(252,211,77,0.40)' : '1px solid rgba(255,255,255,0.10)',
                          color: active ? '#FCD34D' : 'rgba(255,255,255,0.55)',
                          fontSize: '12px', fontWeight: active ? 700 : 400,
                          cursor: 'pointer', transition: 'all .12s ease',
                        }}>
                          <span>{emoji}</span> {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Group name */}
              <div className="gb-field" style={FIELD}>
                <PartyPopper size={15} color="rgba(252,211,77,0.60)" style={{ flexShrink: 0 }} />
                <input value={groupName} onChange={e => setGroupName(e.target.value)}
                  placeholder={tx.groupNamePlaceholder}
                  style={INPUT} />
              </div>

              {/* Party size */}
              <div style={{ ...CARD, padding: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
                  {tx.guestCount}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                    {[10, 15, 20, 30, 40, 50, 75, 100].map(n => {
                      const active = partySize === n
                      return (
                        <button key={n} onClick={() => setPartySize(n)} style={{
                          padding: '7px 14px', borderRadius: '10px',
                          background: active ? 'rgba(252,211,77,0.15)' : 'rgba(255,255,255,0.05)',
                          border: active ? '1px solid rgba(252,211,77,0.40)' : '1px solid rgba(255,255,255,0.10)',
                          color: active ? '#FCD34D' : 'rgba(255,255,255,0.55)',
                          fontSize: '13px', fontWeight: active ? 700 : 400,
                          cursor: 'pointer', transition: 'all .12s ease',
                        }}>
                          {n}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => setPartySize(p => Math.max(1, p - 1))} style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '16px', cursor: 'pointer',
                    }}>−</button>
                    <span style={{ fontFamily: 'var(--font-dm-serif, serif)', fontSize: '20px', color: '#FCD34D', minWidth: '36px', textAlign: 'center' }}>
                      {partySize}
                    </span>
                    <button onClick={() => setPartySize(p => p + 1)} style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '16px', cursor: 'pointer',
                    }}>+</button>
                  </div>
                </div>
              </div>

              {/* Date & time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="gb-field" style={{ ...FIELD }}>
                  <Calendar size={14} color="rgba(252,211,77,0.60)" style={{ flexShrink: 0 }} />
                  <input type="date" value={eventDate} min={today}
                    onChange={e => setEventDate(e.target.value)}
                    style={{ ...INPUT, colorScheme: 'dark' }} />
                </div>
                <div className="gb-field" style={{ ...FIELD }}>
                  <Clock size={14} color="rgba(252,211,77,0.60)" style={{ flexShrink: 0 }} />
                  <input type="time" value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={{ ...INPUT, colorScheme: 'dark' }} />
                </div>
              </div>
              <div className="gb-field" style={{ ...FIELD }}>
                <Clock size={14} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                <input type="time" value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  style={{ ...INPUT, colorScheme: 'dark' }} />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.20)', flexShrink: 0 }}>
                  {tx.endTimeOptional}
                </span>
              </div>

              {/* Menu preference */}
              <div style={{ ...CARD, padding: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
                  {tx.menuPref}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(Object.entries(tx.menuLabels) as [MenuType, string][]).map(([key, label]) => {
                    const active = menuType === key
                    return (
                      <button key={key} onClick={() => setMenuType(active ? '' : key)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '12px',
                        background: active ? 'rgba(252,211,77,0.15)' : 'rgba(255,255,255,0.05)',
                        border: active ? '1px solid rgba(252,211,77,0.40)' : '1px solid rgba(255,255,255,0.10)',
                        color: active ? '#FCD34D' : 'rgba(255,255,255,0.55)',
                        fontSize: '13px', fontWeight: active ? 700 : 400,
                        cursor: 'pointer', transition: 'all .12s ease',
                      }}>
                        <ChefHat size={12} /> {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Special requests */}
              <div className="gb-field" style={{ ...FIELD, alignItems: 'flex-start', padding: '13px 16px' }}>
                <MessageSquare size={15} color="rgba(252,211,77,0.60)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <textarea value={requests} onChange={e => setRequests(e.target.value)}
                  placeholder={tx.requestsPlaceholder}
                  rows={3} style={{ ...INPUT, resize: 'none', lineHeight: 1.6 }} />
              </div>

              <button onClick={() => setStep('contact')}
                disabled={!eventDate || !startTime}
                style={{
                  width: '100%', padding: '16px', borderRadius: '18px',
                  background: eventDate && startTime ? 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: eventDate && startTime ? '#78350f' : 'rgba(255,255,255,0.20)',
                  fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '15px', fontWeight: 800,
                  cursor: eventDate && startTime ? 'pointer' : 'not-allowed',
                  boxShadow: eventDate && startTime ? '0 8px 24px rgba(252,211,77,0.25)' : 'none',
                  transition: 'all .2s ease',
                }}>
                {tx.continue}
              </button>
            </div>
          )}

          {/* ══ STEP 3: CONTACT DETAILS ══════════════════════════════ */}
          {step === 'contact' && selectedR && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ ...CARD, padding: '16px 18px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
                  {tx.summary}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { icon: Building2, label: lang === 'DE' ? 'Restaurant' : 'Restaurant', value: selectedR.name },
                    { icon: Users,     label: lang === 'DE' ? 'Gäste'      : 'Guests',     value: `${partySize} ${lang === 'DE' ? 'Personen' : 'people'}` },
                    { icon: Calendar,  label: lang === 'DE' ? 'Datum'      : 'Date',       value: eventDate ? new Date(eventDate + 'T12:00').toLocaleDateString(lang === 'DE' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                    { icon: Clock,     label: lang === 'DE' ? 'Uhrzeit'    : 'Time',       value: startTime || '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px', padding: '10px 12px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <Icon size={12} color="rgba(252,211,77,0.60)" />
                      <div>
                        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
                        <p style={{ fontSize: '12px', color: '#fff', fontWeight: 700, margin: '1px 0 0' }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {(groupName || eventType) && (
                  <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(252,211,77,0.06)', border: '1px solid rgba(252,211,77,0.12)', borderRadius: '10px' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(252,211,77,0.70)', margin: 0 }}>
                      {groupName || eventType}{menuType ? ` · ${tx.menuLabels[menuType]}` : ''}
                    </p>
                  </div>
                )}
                <button onClick={() => setStep('event')}
                  style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ChevronLeft size={11} /> {tx.editEvent}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="gb-field" style={FIELD}>
                  <User size={15} color="rgba(252,211,77,0.60)" style={{ flexShrink: 0 }} />
                  <input value={orgName} onChange={e => setOrgName(e.target.value)}
                    placeholder={tx.fields.name} style={INPUT} autoComplete="name" />
                </div>
                <div className="gb-field" style={FIELD}>
                  <Mail size={15} color="rgba(252,211,77,0.60)" style={{ flexShrink: 0 }} />
                  <input value={orgEmail} onChange={e => setOrgEmail(e.target.value)}
                    placeholder={tx.fields.email} type="email" style={INPUT} autoComplete="email" />
                </div>
                <div className="gb-field" style={FIELD}>
                  <Phone size={15} color="rgba(252,211,77,0.60)" style={{ flexShrink: 0 }} />
                  <input value={orgPhone} onChange={e => setOrgPhone(e.target.value)}
                    placeholder={tx.fields.phone} type="tel" style={INPUT} autoComplete="tel" />
                </div>
              </div>

              {/* Consent */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '14px', padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
              }}>
                <input type="checkbox" id="gb-consent" checked={consented}
                  onChange={e => setConsented(e.target.checked)}
                  style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#FCD34D', flexShrink: 0, cursor: 'pointer' }} />
                <label htmlFor="gb-consent" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '12px', color: 'rgba(255,255,255,0.40)', lineHeight: 1.6, cursor: 'pointer' }}>
                  {tx.consentTemplate(selectedR.name)}{' '}
                  <a href="/privacy" target="_blank" style={{ color: 'rgba(252,211,77,0.65)', textDecoration: 'none' }}>{tx.privacyLink}</a>
                </label>
              </div>

              {submitErr && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '12px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>{submitErr}</p>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!canSubmit || sending}
                style={{
                  width: '100%', padding: '17px', borderRadius: '18px',
                  background: canSubmit ? 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: canSubmit ? '#78350f' : 'rgba(255,255,255,0.20)',
                  fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '15px', fontWeight: 800,
                  cursor: canSubmit && !sending ? 'pointer' : 'not-allowed',
                  boxShadow: canSubmit ? '0 8px 24px rgba(252,211,77,0.25)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all .2s ease',
                }}>
                {sending ? (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2.5px solid rgba(120,53,15,0.25)', borderTopColor: '#78350f', animation: 'gb-spin .7s linear infinite' }} />
                ) : tx.sendButton}
              </button>
            </div>
          )}

          {/* ══ DONE ═════════════════════════════════════════════════ */}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '32px', gap: '16px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(252,211,77,0.12)', border: '2px solid rgba(252,211,77,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 32px rgba(252,211,77,0.15)',
              }}>
                <CheckCircle2 size={32} color="#FCD34D" strokeWidth={1.5} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-dm-serif, serif)', fontSize: '26px', color: '#fff', margin: '0 0 8px' }}>
                  {tx.done.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.50)', margin: 0, maxWidth: '320px', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: tx.done.message(
                    `<strong style="color:rgba(255,255,255,0.75)">${selectedR?.name ?? ''}</strong>`,
                    `<strong style="color:rgba(255,255,255,0.75)">${orgEmail}</strong>`
                  )}}
                />
              </div>

              <div style={{ ...CARD, padding: '18px 20px', width: '100%', marginTop: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                  {tx.done.nextHeading}
                </p>
                {tx.done.nextSteps.map((txt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < tx.done.nextSteps.length - 1 ? '10px' : 0 }}>
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(252,211,77,0.12)', border: '1px solid rgba(252,211,77,0.20)',
                      fontSize: '10px', fontWeight: 700, color: '#FCD34D',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.50)', margin: 0, lineHeight: 1.5 }}>{txt}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <Link href="/" style={{
                  padding: '12px 20px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  {tx.done.backHome}
                </Link>
                <Link href="/restaurants" style={{
                  padding: '12px 20px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                  color: '#78350f', fontSize: '13px', fontWeight: 800,
                  textDecoration: 'none',
                }}>
                  {tx.done.browseR}
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
