'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { type Lang, t } from './translations'

// ─── Zone layout ─────────────────────────────────────────────────────────────
// Kept for fallback visual rendering lines if layout data lacks bounding boxes
const ZONES: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  INDOOR:  { x: 8,   y: 8,   w: 220, h: 148, label: 'Indoor'  },
  BAR:     { x: 240, y: 8,   w: 104, h: 148, label: 'Bar'     },
  OUTDOOR: { x: 8,   y: 168, w: 104, h: 104, label: 'Outdoor' },
  VIP:     { x: 124, y: 168, w: 220, h: 104, label: 'VIP'     },
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveTable {
  id: string
  name: string
  capacity: number
  category: string
  status: 'free' | 'held' | 'reserved'
  heldBySession: string | null
  // Support coordinate parameters mapped from your new interactive layout workspace
  x_position?: number
  y_position?: number
}

type PlacedTable = LiveTable & { x: number; y: number; w: number; h: number }

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
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(40px) saturate(160%)',
  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: '22px',
}

// ─── Demo mock tables ─────────────────────────────────────────────────────────
const DEMO_TABLES: PlacedTable[] = [
  { id:'demo-t1', name:'T1', capacity:2, category:'INDOOR',  status:'free',     heldBySession:null,    x:18,  y:25,  w:58, h:44 },
  { id:'demo-t2', name:'T2', capacity:4, category:'INDOOR',  status:'free',     heldBySession:null,    x:88,  y:25,  w:58, h:44 },
  { id:'demo-t3', name:'T3', capacity:6, category:'INDOOR',  status:'free',     heldBySession:null,    x:158, y:25,  w:58, h:44 },
  { id:'demo-t4', name:'T4', capacity:2, category:'INDOOR',  status:'reserved', heldBySession:null,    x:18,  y:90,  w:58, h:44 },
  { id:'demo-t5', name:'T5', capacity:4, category:'INDOOR',  status:'free',     heldBySession:null,    x:88,  y:90,  w:58, h:44 },
  { id:'demo-t6', name:'T6', capacity:2, category:'BAR',     status:'held',     heldBySession:'other', x:252, y:25,  w:58, h:44 },
  { id:'demo-t7', name:'T7', capacity:4, category:'BAR',     status:'free',     heldBySession:null,    x:252, y:95,  w:58, h:44 },
  { id:'demo-t8', name:'T8', capacity:2, category:'OUTDOOR', status:'free',     heldBySession:null,    x:18,  y:180, w:58, h:44 },
  { id:'demo-t9', name:'T9', capacity:8, category:'VIP',     status:'free',     heldBySession:null,    x:136, y:180, w:58, h:44 },
  { id:'demo-t10',name:'T10',capacity:4, category:'VIP',     status:'reserved', heldBySession:null,    x:210, y:180, w:58, h:44 },
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  lang: Lang
  dateStr: string
  rawDate: string
  timeStr: string
  restaurantId: string
  partySize: number
  demoMode?: boolean
  onBack: () => void
  onNext: (tableId: string, tableName: string) => void
}

const HOLD_RENEW_MS = 90_000
const POLL_MS       = 15_000
const HOLD_SECS     = 180

export function Screen2({ lang, dateStr, rawDate, timeStr, restaurantId, partySize, demoMode = false, onNext }: Props) {
  const tr        = t[lang]
  const sessionId = useRef(getOrCreateSessionId())
  const time      = parseTimeFrom(timeStr)

  const [tables,    setTables]    = useState<PlacedTable[]>([])
  const [zones,     setZones]     = useState<typeof ZONES>(ZONES)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [selId,     setSelId]     = useState<string | null>(null)
  const [holding,   setHolding]   = useState(false)
  const [holdErr,   setHoldErr]   = useState<string | null>(null)
  const [countdown, setCountdown] = useState(HOLD_SECS)
  const [heldUntil, setHeldUntil] = useState<Date | null>(null)

  const renewRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const countRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevSelId = useRef<string | null>(null)

  // ── Fetch custom positions from layout workspace ──────────────────────────
  const fetchTables = useCallback(async () => {
    if (demoMode) {
      setTables(DEMO_TABLES)
      setZones(ZONES)
      setLoading(false)
      return
    }
    try {
      // 1. Fetch live availabilities
      const resAvailability = await fetch(
        `/api/reservations/tables?date=${rawDate}&time=${time}&duration=90&restaurantId=${restaurantId}`
      )
      if (!resAvailability.ok) throw new Error('Failed to load table metrics')
      const availabilityJson: { tables: LiveTable[] } = await resAvailability.json()

      // 2. Fetch zones + table positions from layout
      const resLayout = await fetch(`/api/layout?restaurantId=${restaurantId}`)
      let layoutPositions: Record<string, { x: number; y: number }> = {}
      let apiZones: typeof ZONES = {}

      if (resLayout.ok) {
        const layoutJson = await resLayout.json()

        if (Array.isArray(layoutJson.tables)) {
          layoutJson.tables.forEach((item: any) => {
            if (item.id) layoutPositions[item.id] = { x: item.x, y: item.y }
          })
        }

        if (Array.isArray(layoutJson.zones) && layoutJson.zones.length > 0) {
          apiZones = {}
          layoutJson.zones.forEach((z: any) => {
            apiZones[z.label.toUpperCase()] = {
              x: z.x, y: z.y, w: z.w, h: z.h, label: z.label
            }
          })
        }
      }

      setZones(Object.keys(apiZones).length > 0 ? apiZones : ZONES)

      // 3. Merge live statuses with custom positions from your new workspace workspace
      const placed: PlacedTable[] = availabilityJson.tables.map((live) => {
        const effectiveStatus =
          live.status === 'held' && live.heldBySession === sessionId.current
            ? 'free' : live.status

        // Match custom coordinates saved from the custom designer workspace workspace
        const savedPos = layoutPositions[live.id] || { 
          x: live.x_position, 
          y: live.y_position 
        }

        // Fallback strategy if table coordinates haven't been configured via workspace drag-and-drop yet
        const fallbackZone = ZONES[live.category.toUpperCase()] || ZONES.INDOOR
        const x = savedPos.x !== undefined ? savedPos.x : (fallbackZone.x + 20)
        const y = savedPos.y !== undefined ? savedPos.y : (fallbackZone.y + 30)

        return {
          ...live,
          x,
          y,
          w: 58, // Standard layout box width
          h: 44, // Standard layout box height
          status: effectiveStatus,
        }
      })

      setTables(placed)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [rawDate, time, restaurantId, demoMode])

  useEffect(() => {
    fetchTables()
    if (!demoMode) {
      pollRef.current = setInterval(fetchTables, POLL_MS)
    }
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

  // ── Table click ─────────────────────────────────────────────────────────────
  const handleSelect = async (table: PlacedTable) => {
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <style>{`
        @keyframes tablePulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes holdGlow   { 0%,100%{box-shadow:0 0 0 0 rgba(13,71,43,0.4)} 50%{box-shadow:0 0 0 6px rgba(13,71,43,0)} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        .tbl-pulse { animation: tablePulse 1.9s ease-in-out infinite }
      `}</style>

      {/* Summary pill */}
      <div style={{ ...GLASS, borderRadius: '100px', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px rgba(52,211,153,0.5)', flexShrink: 0 }}/>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 400, flex: 1 }}>
          <strong style={{ color: '#fff' }}>{dateStr}</strong> · {timeStr}
        </span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: '#34D399', fontWeight: 700, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)', borderRadius: '100px', padding: '3px 10px', flexShrink: 0 }}>
          {partySize} {partySize === 1 ? (lang === 'DE' ? 'Person' : 'guest') : (lang === 'DE' ? 'Personen' : 'guests')}
        </span>
      </div>

      {/* Hold timer */}
      {selId && heldUntil && (
        <div style={{ background: countdown < 60 ? 'rgba(239,68,68,0.10)' : 'rgba(52,211,153,0.07)', border: `1px solid ${countdown < 60 ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.20)'}`, borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: countdown < 60 ? '#f87171' : '#34D399', animation: 'holdGlow 1.5s ease-in-out infinite', flexShrink: 0 }}/>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: countdown < 60 ? '#fca5a5' : 'rgba(255,255,255,0.65)', flex: 1 }}>
            {lang === 'DE' ? 'Tisch gehalten für' : 'Table held for'} <strong style={{ color: countdown < 60 ? '#fca5a5' : '#34D399' }}>{fmtCountdown(countdown)}</strong>
            {lang === 'DE' ? ' — bitte Details ausfüllen' : ' — please fill in your details'}
          </span>
        </div>
      )}

      {/* Error */}
      {holdErr && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: '14px', padding: '10px 16px' }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#fca5a5' }}>{holdErr}</span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[
          { label: tr.free,                                      fill: 'rgba(255,255,255,0.18)', stroke: 'rgba(255,255,255,0.35)' },
          { label: lang === 'DE' ? 'Gehalten' : 'Held',         fill: 'rgba(251,191,36,0.20)',  stroke: 'rgba(251,191,36,0.45)'  },
          { label: tr.reserved,                                  fill: 'rgba(100,116,139,0.20)', stroke: 'rgba(100,116,139,0.35)' },
          { label: tr.selected,                                  fill: 'rgba(52,211,153,0.18)',  stroke: '#34D399'                },
          { label: lang === 'DE' ? 'Zu klein' : 'Too small',    fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.12)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '16px', height: '10px', borderRadius: '3px', background: item.fill, border: `1.5px solid ${item.stroke}` }}/>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Floor plan */}
      <div style={{ ...GLASS, padding: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2.5px solid rgba(52,211,153,0.20)', borderTopColor: '#34D399', animation: 'spin 0.75s linear infinite' }}/>
          </div>
        ) : error ? (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#fca5a5' }}>{error}</span>
            <button onClick={fetchTables} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#34D399', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              {lang === 'DE' ? 'Erneut versuchen' : 'Try again'}
            </button>
          </div>
        ) : (
          <svg width="100%" viewBox="0 0 420 280" style={{ display: 'block' }}>
            <defs>
              <filter id="tbl-glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="tbl-sel"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            <rect x="2" y="2" width="416" height="276" rx="16"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)"
              strokeWidth="1.5" strokeDasharray="6 5"/>

            <rect x="170" y="264" width="80" height="14" rx="5"
              fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
            <text x="210" y="274" textAnchor="middle"
              style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '7px', fill: 'rgba(255,255,255,0.40)' }}>
              {tr.entrance}
            </text>

            {Object.entries(zones).map(([cat, zone]) => (
              <g key={cat}>
                <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="10"
                  fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"/>
                <text x={zone.x + 10} y={zone.y + 13}
                  style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '8px', fontWeight: 700, fill: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {zone.label}
                </text>
              </g>
            ))}

            {tables.map(tb => {
              const isSel      = tb.id === selId
              const isReserved = tb.status === 'reserved'
              const isHeld     = tb.status === 'held'
              const tooSmall   = tb.capacity < partySize
              const canClick   = tb.status === 'free' && !tooSmall

              const fill   = isSel      ? 'rgba(52,211,153,0.18)'
                           : tooSmall   ? 'rgba(255,255,255,0.04)'
                           : isHeld     ? 'rgba(251,191,36,0.18)'
                           : isReserved ? 'rgba(100,116,139,0.18)'
                           :              'rgba(255,255,255,0.16)'
              const stroke = isSel      ? '#34D399'
                           : tooSmall   ? 'rgba(255,255,255,0.10)'
                           : isHeld     ? 'rgba(251,191,36,0.50)'
                           : isReserved ? 'rgba(100,116,139,0.35)'
                           :              'rgba(255,255,255,0.30)'
              const txtCol = tooSmall || isReserved ? 'rgba(255,255,255,0.20)'
                           : isHeld     ? 'rgba(251,191,36,0.70)'
                           : isSel      ? '#34D399'
                           :              'rgba(255,255,255,0.85)'

              return (
                <g key={tb.id}
                  onClick={() => canClick && handleSelect(tb)}
                  style={{ cursor: canClick ? 'pointer' : 'default' }}>
                  <rect
                    x={tb.x} y={tb.y} width={tb.w} height={tb.h} rx="9"
                    fill={fill} stroke={stroke}
                    strokeWidth={isSel ? 2 : 1.5}
                    filter={isSel ? 'url(#tbl-sel)' : canClick ? 'url(#tbl-glow)' : ''}
                    className={isSel ? 'tbl-pulse' : ''}
                    style={{ transition: 'fill .2s, stroke .2s' }}
                  />
                  {isHeld && (
                    <circle cx={tb.x + tb.w - 7} cy={tb.y + 7} r="4" fill="rgba(251,191,36,0.80)"/>
                  )}
                  <text x={tb.x + tb.w / 2} y={tb.y + tb.h / 2 - 5} textAnchor="middle"
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '10px', fontWeight: 700, fill: txtCol, userSelect: 'none' }}>
                    {tb.name}
                  </text>
                  <text x={tb.x + tb.w / 2} y={tb.y + tb.h / 2 + 8} textAnchor="middle"
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '8px', fill: tooSmall ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.40)', userSelect: 'none' }}>
                    {tb.capacity}P
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* Selected table action card */}
      <div style={{ transition: 'opacity .2s ease, transform .2s ease', opacity: selTable ? 1 : 0, transform: selTable ? 'translateY(0)' : 'translateY(6px)', pointerEvents: selTable ? 'auto' : 'none' }}>
        <div style={{ ...GLASS, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '17px', color: '#fff', letterSpacing: '-0.01em' }}>
              {lang === 'DE' ? 'Tisch' : 'Table'} {selTable?.name ?? '--'}
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.40)', marginTop: '2px' }}>
              {selTable?.capacity ?? '-'} {tr.persons}
              {selTable && <span style={{ marginLeft: '6px', opacity: 0.6 }}>· {selTable.category}</span>}
            </div>
          </div>
          <button onClick={handleNext} disabled={!selTable || holding}
            style={{
              padding: '12px 20px', borderRadius: '14px', flexShrink: 0,
              background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
              border: '1px solid rgba(52,211,153,0.50)',
              color: '#022c22', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: 800,
              cursor: selTable && !holding ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 20px rgba(52,211,153,0.25)',
              opacity: holding ? 0.7 : 1,
              transition: 'all .15s',
            }}>
            {holding ? (lang === 'DE' ? 'Reserviere…' : 'Holding…') : tr.continueDetails}
          </button>
        </div>
      </div>
    </div>
  )
}