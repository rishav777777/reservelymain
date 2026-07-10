'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { type Lang, t } from './translations'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveTable {
  id:            string
  name:          string
  capacity:      number
  category:      string
  status:        'free' | 'held' | 'reserved'
  heldBySession: string | null
}

interface ZoneInfo {
  label:      string
  is_open:    boolean
  sort_order: number
  x:          number
  y:          number
  w:          number
  h:          number
}

interface LayoutTablePos {
  id: string
  x:  number
  y:  number
  w:  number
  h:  number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'reservely_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id) }
  return id
}

function parseTimeFrom(timeStr: string): string {
  return timeStr.split('–')[0].trim().slice(0, 5)
}

const GLASS: React.CSSProperties = {
  background:          'rgba(255,255,255,0.06)',
  backdropFilter:      'blur(40px) saturate(160%)',
  WebkitBackdropFilter:'blur(40px) saturate(160%)',
  border:              '1px solid rgba(255,255,255,0.11)',
  borderRadius:        '22px',
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_ZONES: ZoneInfo[] = [
  { label: 'Indoor',  is_open: true, sort_order: 0, x:  20, y:  20, w: 340, h: 240 },
  { label: 'Bar',     is_open: true, sort_order: 1, x: 380, y:  20, w: 180, h: 180 },
  { label: 'Outdoor', is_open: true, sort_order: 2, x:  20, y: 280, w: 280, h: 180 },
  { label: 'VIP',     is_open: true, sort_order: 3, x: 380, y: 220, w: 180, h: 160 },
]

const DEMO_TABLES: LiveTable[] = [
  { id:'demo-t1',  name:'T1',  capacity:2, category:'INDOOR',  status:'free',     heldBySession:null    },
  { id:'demo-t2',  name:'T2',  capacity:4, category:'INDOOR',  status:'free',     heldBySession:null    },
  { id:'demo-t3',  name:'T3',  capacity:6, category:'INDOOR',  status:'free',     heldBySession:null    },
  { id:'demo-t4',  name:'T4',  capacity:2, category:'INDOOR',  status:'reserved', heldBySession:null    },
  { id:'demo-t5',  name:'T5',  capacity:4, category:'INDOOR',  status:'free',     heldBySession:null    },
  { id:'demo-t6',  name:'T6',  capacity:2, category:'BAR',     status:'held',     heldBySession:'other' },
  { id:'demo-t7',  name:'T7',  capacity:4, category:'BAR',     status:'free',     heldBySession:null    },
  { id:'demo-t8',  name:'T8',  capacity:2, category:'OUTDOOR', status:'free',     heldBySession:null    },
  { id:'demo-t9',  name:'T9',  capacity:8, category:'VIP',     status:'free',     heldBySession:null    },
  { id:'demo-t10', name:'T10', capacity:4, category:'VIP',     status:'reserved', heldBySession:null    },
]

const DEMO_LAYOUT_TABLES: LayoutTablePos[] = [
  { id:'demo-t1',  x:  40, y:  50, w: 60, h: 44 },
  { id:'demo-t2',  x: 120, y:  50, w: 60, h: 44 },
  { id:'demo-t3',  x: 200, y:  50, w: 60, h: 44 },
  { id:'demo-t4',  x:  40, y: 130, w: 60, h: 44 },
  { id:'demo-t5',  x: 120, y: 130, w: 60, h: 44 },
  { id:'demo-t6',  x: 400, y:  50, w: 60, h: 44 },
  { id:'demo-t7',  x: 480, y:  50, w: 60, h: 44 },
  { id:'demo-t8',  x:  40, y: 310, w: 60, h: 44 },
  { id:'demo-t9',  x: 400, y: 250, w: 60, h: 44 },
  { id:'demo-t10', x: 480, y: 250, w: 60, h: 44 },
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  lang:         Lang
  dateStr:      string
  rawDate:      string
  timeStr:      string
  restaurantId: string
  partySize:    number
  demoMode?:    boolean
  onBack:       () => void
  onNext:       (tableId: string, tableName: string) => void
}

const HOLD_RENEW_MS = 90_000
const POLL_MS       = 15_000
const HOLD_SECS     = 180

export function Screen2({ lang, dateStr, rawDate, timeStr, restaurantId, partySize, demoMode = false, onNext }: Props) {
  const tr        = t[lang]
  const sessionId = useRef(getOrCreateSessionId())
  const time      = parseTimeFrom(timeStr)

  const [tables,       setTables]       = useState<LiveTable[]>([])
  const [zones,        setZones]        = useState<ZoneInfo[]>([])
  const [layoutTables, setLayoutTables] = useState<LayoutTablePos[]>([])
  const [activeZone,   setActiveZone]   = useState<string>('')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [selId,      setSelId]      = useState<string | null>(null)
  const [holding,    setHolding]    = useState(false)
  const [holdErr,    setHoldErr]    = useState<string | null>(null)
  const [countdown,  setCountdown]  = useState(HOLD_SECS)
  const [heldUntil,  setHeldUntil]  = useState<Date | null>(null)

  const renewRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const countRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevSelId = useRef<string | null>(null)

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    if (demoMode) {
      setZones(DEMO_ZONES)
      setTables(DEMO_TABLES)
      setLayoutTables(DEMO_LAYOUT_TABLES)
      setActiveZone(prev => prev || DEMO_ZONES[0].label.toUpperCase())
      setLoading(false)
      return
    }

    try {
      // 1. Live table availability
      const resAvail = await fetch(
        `/api/reservations/tables?date=${rawDate}&time=${time}&duration=90&restaurantId=${restaurantId}`
      )
      if (!resAvail.ok) throw new Error('Failed to load table data')
      const { tables: liveTables } = await resAvail.json() as {
        tables: Array<{ id: string; name: string; capacity: number; category: string; status: 'free'|'held'|'reserved'; heldBySession: string|null }>
      }

      // 2. Zone list + is_open from layout API
      let fetchedZones: ZoneInfo[] = []
      const closedKeys = new Set<string>()

      const resLayout = await fetch(`/api/layout?restaurantId=${restaurantId}`)
      if (resLayout.ok) {
        const layoutJson = await resLayout.json()
        if (Array.isArray(layoutJson.zones) && layoutJson.zones.length > 0) {
          fetchedZones = (layoutJson.zones as Array<{ label: string; is_open: boolean; sort_order?: number; x?: number; y?: number; w?: number; h?: number }>)
            .map(z => ({
              label:      z.label,
              is_open:    z.is_open !== false,
              sort_order: z.sort_order ?? 0,
              x:          z.x ?? 0,
              y:          z.y ?? 0,
              w:          z.w ?? 200,
              h:          z.h ?? 140,
            }))
            .sort((a, b) => a.sort_order - b.sort_order)

          fetchedZones
            .filter(z => !z.is_open)
            .forEach(z => closedKeys.add(z.label.toUpperCase()))
        }

        if (Array.isArray(layoutJson.tables)) {
          setLayoutTables(
            (layoutJson.tables as Array<{ id: string; x?: number; y?: number; w?: number; h?: number }>)
              .map(t => ({ id: t.id, x: t.x ?? 0, y: t.y ?? 0, w: t.w ?? 58, h: t.h ?? 44 }))
          )
        }
      }

      // 3. Correct session-own holds + strip closed-zone tables
      const processed: LiveTable[] = liveTables
        .map(tb => ({
          ...tb,
          status: (tb.status === 'held' && tb.heldBySession === sessionId.current
            ? 'free' as const : tb.status),
        }))
        .filter(tb => !closedKeys.has(tb.category.toUpperCase()))

      // 4. If layout has no zones, derive from table categories
      const openZones = fetchedZones.filter(z => z.is_open)
      if (openZones.length === 0) {
        const seen = new Set<string>()
        processed.forEach(tb => seen.add(tb.category))
        fetchedZones = [...seen].map((c, i) => ({ label: c, is_open: true, sort_order: i, x: 0, y: 0, w: 0, h: 0 }))
      }

      const visibleZones = fetchedZones.filter(z => z.is_open)
      setZones(visibleZones)
      setTables(processed)
      setError(null)

      // Only set active zone on first load — keep user's tab selection on polls
      setActiveZone(prev => prev || visibleZones[0]?.label.toUpperCase() || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [rawDate, time, restaurantId, demoMode])

  useEffect(() => {
    fetchTables()
    if (!demoMode) pollRef.current = setInterval(fetchTables, POLL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchTables, demoMode])

  // ── Hold helpers ────────────────────────────────────────────────────────────
  const releaseHold = useCallback(async (tableId: string) => {
    if (!demoMode) {
      await fetch('/api/reservations/hold', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, date: rawDate, time, sessionId: sessionId.current, restaurantId }),
      })
    }
    if (renewRef.current) clearInterval(renewRef.current)
    if (countRef.current) clearInterval(countRef.current)
  }, [rawDate, time, restaurantId, demoMode])

  useEffect(() => {
    return () => {
      if (prevSelId.current) releaseHold(prevSelId.current)
      if (renewRef.current)  clearInterval(renewRef.current)
      if (pollRef.current)   clearInterval(pollRef.current)
      if (countRef.current)  clearInterval(countRef.current)
    }
  }, [releaseHold])

  const placeHold = useCallback(async (tableId: string): Promise<boolean> => {
    if (demoMode) {
      setHeldUntil(new Date(Date.now() + HOLD_SECS * 1000))
      setCountdown(HOLD_SECS)
      return true
    }
    const res = await fetch('/api/reservations/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId, date: rawDate, time, duration: 90, sessionId: sessionId.current, restaurantId }),
    })
    if (!res.ok) return false
    const json = await res.json()
    setHeldUntil(new Date(json.heldUntil))
    setCountdown(HOLD_SECS)
    return true
  }, [rawDate, time, restaurantId, demoMode])

  const handleSelect = async (table: LiveTable) => {
    if (table.status !== 'free' || holding || table.capacity < partySize) return
    setHolding(true)
    setHoldErr(null)

    if (prevSelId.current && prevSelId.current !== table.id) {
      await releaseHold(prevSelId.current)
      prevSelId.current = null
    }

    if (selId === table.id) {
      await releaseHold(table.id)
      setSelId(null); prevSelId.current = null; setHeldUntil(null)
      setHolding(false); return
    }

    const ok = await placeHold(table.id)
    if (!ok) {
      setHoldErr(lang === 'DE'
        ? 'Dieser Tisch wurde soeben reserviert. Bitte wähle einen anderen.'
        : 'This table was just taken. Please choose another.')
      await fetchTables()
      setHolding(false); return
    }

    setSelId(table.id)
    prevSelId.current = table.id

    if (renewRef.current) clearInterval(renewRef.current)
    renewRef.current = setInterval(() => placeHold(table.id), HOLD_RENEW_MS)

    if (countRef.current) clearInterval(countRef.current)
    setCountdown(HOLD_SECS)
    countRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countRef.current!); clearInterval(renewRef.current!)
          setSelId(null); prevSelId.current = null; setHeldUntil(null)
          setHoldErr(lang === 'DE'
            ? 'Deine Reservierung ist abgelaufen. Bitte wähle erneut.'
            : 'Your hold expired. Please select again.')
          fetchTables(); return 0
        }
        return prev - 1
      })
    }, 1000)

    setHolding(false)
  }

  const selTable     = tables.find(tb => tb.id === selId)
  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleNext = () => {
    if (!selTable) return
    if (renewRef.current) clearInterval(renewRef.current)
    if (countRef.current) clearInterval(countRef.current)
    onNext(selTable.id, selTable.name)
  }

  const tablesInZone = (zoneLabel: string) =>
    tables.filter(tb => tb.category.toUpperCase() === zoneLabel.toUpperCase())

  const visibleTables   = tablesInZone(activeZone)
  const activeZoneIdx   = Math.max(0, zones.findIndex(z => z.label.toUpperCase() === activeZone))
  const currentZone     = zones[activeZoneIdx] ?? null
  const goLeft          = () => { if (activeZoneIdx > 0) setActiveZone(zones[activeZoneIdx - 1].label.toUpperCase()) }
  const goRight         = () => { if (activeZoneIdx < zones.length - 1) setActiveZone(zones[activeZoneIdx + 1].label.toUpperCase()) }
  const hasLayoutPositions = layoutTables.length > 0

  const pad = 24
  const vbX = (currentZone?.x ?? 0) - pad
  const vbY = (currentZone?.y ?? 0) - pad
  const vbW = (currentZone?.w ?? 400) + pad * 2
  const vbH = (currentZone?.h ?? 280) + pad * 2
  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <style>{`
        @keyframes holdGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(13,71,43,0.4)} 50%{box-shadow:0 0 0 6px rgba(13,71,43,0)} }
        @keyframes selPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.3)} 50%{box-shadow:0 0 0 8px rgba(52,211,153,0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        .tbl-selected        { animation: selPulse 2s ease-in-out infinite }
        .zone-scroller::-webkit-scrollbar { display:none }
      `}</style>

      {/* ── Summary pill ─────────────────────────────────────────────────────── */}
      <div style={{ ...GLASS, borderRadius:'100px', padding:'11px 18px', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#34D399', boxShadow:'0 0 8px rgba(52,211,153,0.5)', flexShrink:0 }}/>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.75)', fontWeight:400, flex:1 }}>
          <strong style={{ color:'#fff' }}>{dateStr}</strong> · {timeStr}
        </span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'11px', color:'#34D399', fontWeight:700, background:'rgba(52,211,153,0.10)', border:'1px solid rgba(52,211,153,0.20)', borderRadius:'100px', padding:'3px 10px', flexShrink:0 }}>
          {partySize} {partySize === 1 ? (lang === 'DE' ? 'Person' : 'guest') : (lang === 'DE' ? 'Personen' : 'guests')}
        </span>
      </div>

      {/* ── Hold timer ───────────────────────────────────────────────────────── */}
      {selId && heldUntil && (
        <div style={{ background: countdown < 60 ? 'rgba(239,68,68,0.10)' : 'rgba(52,211,153,0.07)', border:`1px solid ${countdown < 60 ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.20)'}`, borderRadius:'14px', padding:'10px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: countdown < 60 ? '#f87171' : '#34D399', animation:'holdGlow 1.5s ease-in-out infinite', flexShrink:0 }}/>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'12px', color: countdown < 60 ? '#fca5a5' : 'rgba(255,255,255,0.65)', flex:1 }}>
            {lang === 'DE' ? 'Tisch gehalten für' : 'Table held for'}{' '}
            <strong style={{ color: countdown < 60 ? '#fca5a5' : '#34D399' }}>{fmtCountdown(countdown)}</strong>
            {lang === 'DE' ? ' — bitte Details ausfüllen' : ' — please fill in your details'}
          </span>
        </div>
      )}

      {/* ── Hold error ───────────────────────────────────────────────────────── */}
      {holdErr && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:'14px', padding:'10px 16px' }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'12px', color:'#fca5a5' }}>{holdErr}</span>
        </div>
      )}

      {/* ── Zone navigation ──────────────────────────────────────────────────── */}
      {!loading && !error && zones.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button onClick={goLeft} disabled={activeZoneIdx === 0}
            aria-label="Previous section"
            style={{
              width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
              background:      activeZoneIdx === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
              border:          `1.5px solid ${activeZoneIdx === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.18)'}`,
              color:           activeZoneIdx === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.80)',
              fontSize:        '20px', lineHeight:1,
              cursor:          activeZoneIdx === 0 ? 'default' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all .15s',
            }}>‹</button>

          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'14px', fontWeight:700, color:'#fff', letterSpacing:'-0.01em' }}>
              {currentZone?.label}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'2px' }}>
              {tablesInZone(activeZone).filter(tb => tb.status === 'free' && tb.capacity >= partySize).length}
              {' '}{lang === 'DE' ? 'frei' : 'available'}
              {' '}·{' '}{activeZoneIdx + 1}/{zones.length}
            </div>
          </div>

          <button onClick={goRight} disabled={activeZoneIdx === zones.length - 1}
            aria-label="Next section"
            style={{
              width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
              background:      activeZoneIdx === zones.length - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
              border:          `1.5px solid ${activeZoneIdx === zones.length - 1 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.18)'}`,
              color:           activeZoneIdx === zones.length - 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.80)',
              fontSize:        '20px', lineHeight:1,
              cursor:          activeZoneIdx === zones.length - 1 ? 'default' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all .15s',
            }}>›</button>
        </div>
      )}

      {/* ── Floor plan / table grid ───────────────────────────────────────────── */}
      <div style={{ ...GLASS, padding:'12px' }}>
        {loading ? (
          <div style={{ height:'220px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:'26px', height:'26px', borderRadius:'50%', border:'2.5px solid rgba(52,211,153,0.20)', borderTopColor:'#34D399', animation:'spin 0.75s linear infinite' }}/>
          </div>

        ) : error ? (
          <div style={{ height:'220px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px' }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'13px', color:'#fca5a5' }}>{error}</span>
            <button onClick={fetchTables} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'12px', color:'#34D399', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
              {lang === 'DE' ? 'Erneut versuchen' : 'Try again'}
            </button>
          </div>

        ) : visibleTables.length === 0 ? (
          <div style={{ height:'160px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            <span style={{ fontSize:'24px' }}>🪑</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.40)' }}>
              {lang === 'DE' ? 'Keine Tische in diesem Bereich verfügbar' : 'No tables available in this section'}
            </span>
          </div>

        ) : hasLayoutPositions ? (
          /* ── SVG floor plan ─────────────────────────────────────────────────── */
          <svg
            width="100%" height="280"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            style={{ display:'block', borderRadius:'14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}
          >
            <defs>
              <pattern id="booking-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#booking-dots)" />
            {currentZone && (
              <rect x={currentZone.x} y={currentZone.y} width={currentZone.w} height={currentZone.h} rx="12"
                fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" strokeDasharray="5 4" />
            )}
            {visibleTables.map(tb => {
              const pos      = layoutTables.find(p => p.id === tb.id)
              if (!pos) return null
              const isSel      = tb.id === selId
              const isReserved = tb.status === 'reserved'
              const isHeld     = tb.status === 'held'
              const tooSmall   = tb.capacity < partySize
              const canClick   = tb.status === 'free' && !tooSmall
              const fill = isSel      ? 'rgba(52,211,153,0.25)'
                         : tooSmall   ? 'rgba(255,255,255,0.04)'
                         : isHeld     ? 'rgba(251,191,36,0.18)'
                         : isReserved ? 'rgba(100,116,139,0.15)'
                         :              'rgba(255,255,255,0.14)'
              const stroke = isSel      ? '#34D399'
                           : tooSmall   ? 'rgba(255,255,255,0.08)'
                           : isHeld     ? 'rgba(251,191,36,0.45)'
                           : isReserved ? 'rgba(100,116,139,0.30)'
                           :              'rgba(255,255,255,0.22)'
              const nameCol = isSel      ? '#34D399'
                            : tooSmall   ? 'rgba(255,255,255,0.20)'
                            : isHeld     ? 'rgba(251,191,36,0.80)'
                            : isReserved ? 'rgba(255,255,255,0.22)'
                            :              'rgba(255,255,255,0.90)'
              const subLabel = isReserved ? (lang==='DE'?'Belegt':'Reserved')
                             : isHeld     ? (lang==='DE'?'Gehalten':'Held')
                             : tooSmall   ? (lang==='DE'?'Zu klein':'Too small')
                             :              `${tb.capacity}${lang==='DE'?' Pl.':' seats'}`
              return (
                <g key={tb.id}
                  onClick={() => canClick && handleSelect(tb)}
                  style={{ cursor:canClick?'pointer':'default', opacity:(isReserved||(tooSmall&&!isSel))?0.5:1 }}>
                  <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx="9"
                    fill={fill} stroke={stroke} strokeWidth={isSel?2:1.5} />
                  {(isSel || isHeld) && (
                    <circle cx={pos.x+pos.w-5} cy={pos.y+5} r="4"
                      fill={isSel?'#34D399':'#fbbf24'}
                      stroke={isSel?'rgba(52,211,153,0.5)':'rgba(251,191,36,0.5)'}
                      strokeWidth="1" />
                  )}
                  <text x={pos.x+pos.w/2} y={pos.y+pos.h/2-4} textAnchor="middle"
                    style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'10px', fontWeight:700, fill:nameCol, pointerEvents:'none' }}>
                    {tb.name}
                  </text>
                  <text x={pos.x+pos.w/2} y={pos.y+pos.h/2+8} textAnchor="middle"
                    style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'8px', fill:nameCol, opacity:0.65, pointerEvents:'none' }}>
                    {subLabel}
                  </text>
                </g>
              )
            })}
          </svg>

        ) : (
          /* ── Fallback card grid (no layout positions configured) ────────────── */
          <div style={{ padding:'4px' }}>
            {zones.length <= 1 && zones[0] && (
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 12px' }}>
                {zones[0].label}
              </p>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(86px, 1fr))', gap:'8px' }}>
              {visibleTables.map(tb => {
                const isSel      = tb.id === selId
                const isReserved = tb.status === 'reserved'
                const isHeld     = tb.status === 'held'
                const tooSmall   = tb.capacity < partySize
                const canClick   = tb.status === 'free' && !tooSmall
                const bg = isSel      ? 'rgba(52,211,153,0.12)'
                         : tooSmall   ? 'rgba(255,255,255,0.02)'
                         : isHeld     ? 'rgba(251,191,36,0.10)'
                         : isReserved ? 'rgba(100,116,139,0.10)'
                         :              'rgba(255,255,255,0.08)'
                const borderCol = isSel      ? 'rgba(52,211,153,0.55)'
                                : tooSmall   ? 'rgba(255,255,255,0.07)'
                                : isHeld     ? 'rgba(251,191,36,0.35)'
                                : isReserved ? 'rgba(100,116,139,0.25)'
                                :              'rgba(255,255,255,0.14)'
                const nameColor = isSel      ? '#34D399'
                                : tooSmall   ? 'rgba(255,255,255,0.18)'
                                : isHeld     ? 'rgba(251,191,36,0.80)'
                                : isReserved ? 'rgba(255,255,255,0.22)'
                                :              'rgba(255,255,255,0.90)'
                const subLabel = isReserved ? (lang==='DE'?'Belegt':'Reserved')
                               : isHeld     ? (lang==='DE'?'Gehalten':'Held')
                               :              `${tb.capacity}${lang==='DE'?' Pl.':' seats'}`
                const subColor = isReserved ? 'rgba(255,255,255,0.18)'
                               : isHeld     ? 'rgba(251,191,36,0.60)'
                               : tooSmall   ? 'rgba(255,255,255,0.18)'
                               :              'rgba(255,255,255,0.38)'
                return (
                  <div key={tb.id}
                    onClick={() => canClick && handleSelect(tb)}
                    className={isSel ? 'tbl-selected' : ''}
                    style={{
                      background:   bg,
                      border:       `1.5px solid ${borderCol}`,
                      borderRadius: '14px',
                      padding:      '16px 10px 14px',
                      textAlign:    'center',
                      cursor:       canClick ? 'pointer' : 'default',
                      position:     'relative',
                      opacity:      (isReserved || (tooSmall && !isSel)) ? 0.50 : 1,
                      transition:   'all .15s',
                      userSelect:   'none',
                    }}>
                    {(isSel || isHeld) && (
                      <div style={{
                        position:'absolute', top:'7px', right:'7px',
                        width:'6px', height:'6px', borderRadius:'50%',
                        background:  isSel ? '#34D399' : '#fbbf24',
                        boxShadow:   isSel ? '0 0 8px rgba(52,211,153,0.6)' : '0 0 6px rgba(251,191,36,0.5)',
                      }}/>
                    )}
                    <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'16px', color:nameColor, letterSpacing:'-0.01em', lineHeight:1 }}>
                      {tb.name}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'10px', color:subColor, marginTop:'5px', fontWeight:500 }}>
                      {subLabel}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
        {[
          { label: tr.free,                                      bg:'rgba(255,255,255,0.18)', border:'rgba(255,255,255,0.35)' },
          { label: lang==='DE' ? 'Gehalten'  : 'Held',          bg:'rgba(251,191,36,0.20)',  border:'rgba(251,191,36,0.45)'  },
          { label: tr.reserved,                                  bg:'rgba(100,116,139,0.20)', border:'rgba(100,116,139,0.35)' },
          { label: tr.selected,                                  bg:'rgba(52,211,153,0.18)',  border:'#34D399'                },
          { label: lang==='DE' ? 'Zu klein'  : 'Too small',     bg:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.12)' },
        ].map(item => (
          <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:'14px', height:'9px', borderRadius:'3px', background:item.bg, border:`1.5px solid ${item.border}` }}/>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.35)', fontWeight:500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── Selected table action card ────────────────────────────────────────── */}
      <div style={{ transition:'opacity .2s ease, transform .2s ease', opacity:selTable?1:0, transform:selTable?'translateY(0)':'translateY(6px)', pointerEvents:selTable?'auto':'none' }}>
        <div style={{ ...GLASS, padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'17px', color:'#fff', letterSpacing:'-0.01em' }}>
              {lang==='DE' ? 'Tisch' : 'Table'} {selTable?.name ?? '--'}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.40)', marginTop:'2px' }}>
              {selTable?.capacity ?? '-'} {tr.persons}
              {selTable && <span style={{ marginLeft:'6px', opacity:0.6 }}>· {selTable.category}</span>}
            </div>
          </div>
          <button onClick={handleNext} disabled={!selTable || holding}
            style={{
              padding:'12px 20px', borderRadius:'14px', flexShrink:0,
              background:'linear-gradient(135deg, #34D399 0%, #059669 100%)',
              border:'1px solid rgba(52,211,153,0.50)',
              color:'#022c22', fontFamily:"'DM Sans',sans-serif", fontSize:'13px', fontWeight:800,
              cursor: selTable && !holding ? 'pointer' : 'not-allowed',
              whiteSpace:'nowrap',
              boxShadow:'0 6px 20px rgba(52,211,153,0.25)',
              opacity: holding ? 0.7 : 1,
              transition:'all .15s',
            }}>
            {holding ? (lang==='DE' ? 'Reserviere…' : 'Holding…') : tr.continueDetails}
          </button>
        </div>
      </div>
    </div>
  )
}
