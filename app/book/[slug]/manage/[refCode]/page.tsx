'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { CalendarDays, Clock, Users, MessageSquare, X, CheckCircle, Loader2 } from 'lucide-react'

interface ReservationData {
  id:               string
  reference_code:   string
  guest_name:       string
  party_size:       number
  reservation_date: string
  reservation_time: string
  status:           string
  notes:            string | null
  restaurant_tables?: { name: string } | null
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  return `${h.padStart(2, '0')}:${m}`
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending confirmation', color: '#E8A020' },
  confirmed: { label: 'Confirmed',            color: '#22C55E' },
  arrived:   { label: 'Arrived',              color: '#3B82F6' },
  completed: { label: 'Completed',            color: '#6B7280' },
  cancelled: { label: 'Cancelled',            color: '#EF4444' },
  rejected:  { label: 'Rejected',             color: '#EF4444' },
  no_show:   { label: 'No show',              color: '#9CA3AF' },
}

export default function ManageReservationPage() {
  const { slug, refCode } = useParams<{ slug: string; refCode: string }>()

  const [loading,       setLoading]       = useState(true)
  const [reservation,   setReservation]   = useState<ReservationData | null>(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [error,         setError]         = useState<string | null>(null)

  const [notes,         setNotes]         = useState('')
  const [saving,        setSaving]        = useState(false)
  const [cancelling,    setCancelling]    = useState(false)
  const [done,          setDone]          = useState<'updated' | 'cancelled' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/book/${slug}/manage?ref=${encodeURIComponent(refCode.toUpperCase())}`)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Not found')
    } else {
      const d = await res.json()
      setReservation(d.reservation)
      setRestaurantName(d.restaurantName)
      setNotes(d.reservation.notes ?? '')
    }
    setLoading(false)
  }, [slug, refCode])

  useEffect(() => { load() }, [load])

  const canModify = reservation
    && !['completed', 'cancelled', 'no_show', 'rejected'].includes(reservation.status)
    && new Date(`${reservation.reservation_date}T${reservation.reservation_time}`) > new Date()

  const handleSaveNotes = async () => {
    if (!reservation || saving) return
    setSaving(true)
    const res = await fetch(`/api/book/${slug}/manage?ref=${encodeURIComponent(refCode.toUpperCase())}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'update', notes }),
    })
    setSaving(false)
    if (res.ok) setDone('updated')
  }

  const handleCancel = async () => {
    if (!reservation || cancelling) return
    setCancelling(true)
    const res = await fetch(`/api/book/${slug}/manage?ref=${encodeURIComponent(refCode.toUpperCase())}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'cancel' }),
    })
    setCancelling(false)
    if (res.ok) setDone('cancelled')
    else {
      const d = await res.json()
      setError(d.error ?? 'Could not cancel')
    }
  }

  const GLASS: React.CSSProperties = {
    background:          'rgba(255,255,255,0.45)',
    backdropFilter:      'blur(40px) saturate(180%)',
    WebkitBackdropFilter:'blur(40px) saturate(180%)',
    border:              '1.5px solid rgba(255,255,255,0.6)',
    boxShadow:           '0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7) inset',
    borderRadius:        '24px',
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#F4F6F4',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'32px 16px', fontFamily:"'DM Sans', sans-serif",
    }}>
      <div style={{ width:'100%', maxWidth:'480px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <p style={{ fontFamily:"'DM Serif Display', serif", fontSize:'26px', color:'#1C231F', letterSpacing:'0.06em', textTransform:'uppercase', margin:0 }}>
            {restaurantName || 'Reservely'}
          </p>
          <p style={{ fontSize:'12px', color:'#6A7A76', margin:'6px 0 0' }}>Manage your reservation</p>
        </div>

        {loading && (
          <div style={{ ...GLASS, padding:'40px', display:'flex', justifyContent:'center' }}>
            <Loader2 size={24} color="#0D472B" style={{ animation:'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {error && !loading && (
          <div style={{ ...GLASS, padding:'32px', textAlign:'center' }}>
            <X size={32} color="#EF4444" style={{ marginBottom:'12px' }} />
            <p style={{ fontSize:'15px', fontWeight:700, color:'#1C231F', margin:'0 0 6px' }}>Reservation not found</p>
            <p style={{ fontSize:'13px', color:'#6A7A76', margin:0 }}>{error}</p>
          </div>
        )}

        {done === 'cancelled' && (
          <div style={{ ...GLASS, padding:'40px', textAlign:'center' }}>
            <CheckCircle size={36} color="#EF4444" style={{ marginBottom:'14px' }} />
            <p style={{ fontSize:'16px', fontWeight:700, color:'#1C231F', margin:'0 0 6px' }}>Reservation cancelled</p>
            <p style={{ fontSize:'13px', color:'#6A7A76' }}>Your reservation has been cancelled. We hope to see you another time.</p>
          </div>
        )}

        {done === 'updated' && (
          <div style={{ ...GLASS, padding:'40px', textAlign:'center' }}>
            <CheckCircle size={36} color="#22C55E" style={{ marginBottom:'14px' }} />
            <p style={{ fontSize:'16px', fontWeight:700, color:'#1C231F', margin:'0 0 6px' }}>Notes saved</p>
            <p style={{ fontSize:'13px', color:'#6A7A76' }}>Your special requests have been updated.</p>
            <button onClick={() => setDone(null)} style={{
              marginTop:'16px', padding:'10px 24px', borderRadius:'12px',
              background:'#0D472B', color:'#fff', border:'none',
              fontSize:'13px', fontWeight:600, cursor:'pointer',
            }}>
              Back to reservation
            </button>
          </div>
        )}

        {!loading && !error && !done && reservation && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Status */}
            <div style={{ ...GLASS, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:'11px', color:'#9AABA6', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 3px' }}>
                  {reservation.reference_code}
                </p>
                <p style={{ fontSize:'16px', fontWeight:700, color:'#1C231F', margin:0 }}>
                  {reservation.guest_name}
                </p>
              </div>
              <span style={{
                fontSize:'11px', fontWeight:700, padding:'5px 12px', borderRadius:'100px',
                background: STATUS_LABELS[reservation.status]?.color + '18',
                color:      STATUS_LABELS[reservation.status]?.color ?? '#6B7280',
              }}>
                {STATUS_LABELS[reservation.status]?.label ?? reservation.status}
              </span>
            </div>

            {/* Details */}
            <div style={{ ...GLASS, padding:'20px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <CalendarDays size={16} color="#0D472B" style={{ marginTop:'2px', flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:'10px', color:'#9AABA6', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Date</p>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C231F', margin:0 }}>{formatDate(reservation.reservation_date)}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <Clock size={16} color="#0D472B" style={{ marginTop:'2px', flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:'10px', color:'#9AABA6', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Time</p>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C231F', margin:0 }}>{formatTime(reservation.reservation_time)}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <Users size={16} color="#0D472B" style={{ marginTop:'2px', flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:'10px', color:'#9AABA6', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Guests</p>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C231F', margin:0 }}>{reservation.party_size}</p>
                </div>
              </div>
              {reservation.restaurant_tables?.name && (
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <div style={{ width:'16px', height:'16px', marginTop:'2px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:'13px' }}>🪑</span>
                  </div>
                  <div>
                    <p style={{ fontSize:'10px', color:'#9AABA6', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Table</p>
                    <p style={{ fontSize:'13px', fontWeight:600, color:'#1C231F', margin:0 }}>{reservation.restaurant_tables.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes edit */}
            {canModify && (
              <div style={{ ...GLASS, padding:'20px 24px' }}>
                <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'12px' }}>
                  <MessageSquare size={15} color="#0D472B" />
                  <p style={{ fontSize:'13px', fontWeight:700, color:'#1C231F', margin:0 }}>Special requests</p>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any dietary requirements, allergies, or special requests..."
                  rows={3}
                  style={{
                    width:'100%', padding:'12px 14px', borderRadius:'12px',
                    border:'1.5px solid rgba(0,0,0,0.08)', background:'rgba(255,255,255,0.6)',
                    fontFamily:"'DM Sans', sans-serif", fontSize:'13px', color:'#1C231F',
                    resize:'none', outline:'none', boxSizing:'border-box',
                  }}
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  style={{
                    marginTop:'10px', padding:'11px 20px', borderRadius:'12px',
                    background:'#0D472B', color:'#fff', border:'none',
                    fontSize:'13px', fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save notes'}
                </button>
              </div>
            )}

            {/* Cancel */}
            {canModify && (
              <div style={{ ...GLASS, padding:'20px 24px' }}>
                <p style={{ fontSize:'13px', fontWeight:700, color:'#1C231F', margin:'0 0 6px' }}>Cancel reservation</p>
                <p style={{ fontSize:'12px', color:'#6A7A76', margin:'0 0 14px', lineHeight:1.6 }}>
                  This action cannot be undone. You'll need to make a new reservation to rebook.
                </p>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{
                    padding:'11px 20px', borderRadius:'12px',
                    background:'transparent', color:'#EF4444',
                    border:'1.5px solid #EF4444',
                    fontSize:'13px', fontWeight:600, cursor: cancelling ? 'not-allowed' : 'pointer',
                    opacity: cancelling ? 0.7 : 1,
                  }}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel my reservation'}
                </button>
              </div>
            )}

            {!canModify && (
              <p style={{ textAlign:'center', fontSize:'12px', color:'#9AABA6', padding:'8px' }}>
                This reservation can no longer be modified.
              </p>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
