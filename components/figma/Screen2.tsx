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
  background: 'rgba(255,255,255,0.25)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: '1.5px solid rgba(255,255,255,0.50)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7) inset',
  borderRadius: '28px',
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  lang: Lang
  dateStr: string
  rawDate: string
  timeStr: string
  restaurantId: string
  onBack: () => void
  onNext: (tableId: string, tableName: string, seats: number) => void
}

const HOLD_RENEW_MS = 90_000
const POLL_MS       = 15_000
const HOLD_SECS     = 180

export function Screen2({ lang, dateStr, rawDate, timeStr, restaurantId, onBack, onNext }: Props) {
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
  }, [rawDate, time, restaurantId])

  useEffect(() => {
    fetchTables()
    pollRef.current = setInterval(fetchTables, POLL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchTables])

  // ── Hold helpers ────────────────────────────────────────────────────────────
  const releaseHold = useCallback(async (tableId: string) => {
    await fetch('/api/reservations/hold', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId, date: rawDate, time, sessionId: sessionId.current, restaurantId }),
    })
    if (renewRef.current) clearInterval(renewRef.current)
    if (countRef.current) clearInterval(countRef.current)
  }, [rawDate, time, restaurantId])

  useEffect(() => {
    return () => {
      if (prevSelId.current) releaseHold(prevSelId.current)
      if (renewRef.current)  clearInterval(renewRef.current)
      if (pollRef.current)   clearInterval(pollRef.current)
      if (countRef.current)  clearInterval(countRef.current)
    }
  }, [releaseHold])

  const placeHold = useCallback(async (tableId: string): Promise<boolean> => {
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
  }, [rawDate, time, restaurantId])

  // ── Table click ─────────────────────────────────────────────────────────────
  const handleSelect = async (table: PlacedTable) => {
    if (table.status !== 'free' || holding) return
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
    onNext(selTable.id, selTable.name, selTable.capacity)
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
      <div style={{ ...GLASS, borderRadius: '100px', padding: '12px 22px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.3) 0%,rgba(255,255,255,0) 100%)', borderRadius: '100px 100px 0 0', pointerEvents: 'none' }}/>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0D472B', boxShadow: '0 0 10px rgba(13,71,43,0.35)', flexShrink: 0 }}/>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#1C231F', fontWeight: 500, flex: 1 }}>
          {tr.appointment}: <strong>{dateStr} · {timeStr}</strong>
        </span>
      </div>

      {/* Hold timer */}
      {selId && heldUntil && (
        <div style={{ background: countdown < 60 ? 'rgba(220,53,69,0.08)' : 'rgba(13,71,43,0.06)', border: `1px solid ${countdown < 60 ? 'rgba(220,53,69,0.25)' : 'rgba(13,71,43,0.15)'}`, borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: countdown < 60 ? '#DC3545' : '#0D472B', animation: 'holdGlow 1.5s ease-in-out infinite', flexShrink: 0 }}/>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: countdown < 60 ? '#DC3545' : '#1C231F', flex: 1 }}>
            {lang === 'DE' ? 'Tisch gehalten für' : 'Table held for'} <strong>{fmtCountdown(countdown)}</strong>
            {lang === 'DE' ? ' — bitte Details ausfüllen' : ' — please fill in your details'}
          </span>
        </div>
      )}

      {/* Error */}
      {holdErr && (
        <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.25)', borderRadius: '14px', padding: '10px 16px' }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#DC3545' }}>{holdErr}</span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', paddingLeft: '4px', flexWrap: 'wrap' }}>
        {[
          { label: tr.free,     fill: 'rgba(255,255,255,0.5)',   stroke: 'rgba(13,71,43,0.35)'   },
          { label: lang === 'DE' ? 'Gehalten' : 'Held', fill: 'rgba(255,200,80,0.25)',   stroke: 'rgba(180,130,0,0.45)'  },
          { label: tr.reserved, fill: 'rgba(200,210,206,0.2)', stroke: 'rgba(180,196,190,0.3)' },
          { label: tr.selected, fill: 'rgba(13,71,43,0.12)',   stroke: '#0D472B'               },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '18px', height: '12px', borderRadius: '4px', background: item.fill, border: `1.5px solid ${item.stroke}` }}/>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '10.5px', color: '#8A9A96' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Floor plan viewport */}
      <div style={{ ...GLASS, padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'linear-gradient(180deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0) 100%)', borderRadius: '28px 28px 0 0', pointerEvents: 'none' }}/>

        {loading ? (
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2.5px solid rgba(13,71,43,0.15)', borderTopColor: '#0D472B', animation: 'spin 0.75s linear infinite' }}/>
          </div>
        ) : error ? (
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#DC3545' }}>{error}</span>
            <button onClick={fetchTables} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#0D472B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              {lang === 'DE' ? 'Erneut versuchen' : 'Try again'}
            </button>
          </div>
        ) : (
          <svg width="100%" viewBox="0 0 420 280" style={{ display: 'block' }}>
            <defs>
              <filter id="tbl-glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="tbl-sel"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            {/* Canvas boundaries */}
            <rect x="2" y="2" width="416" height="276" rx="16"
              fill="rgba(255,255,255,0.08)" stroke="rgba(13,71,43,0.07)"
              strokeWidth="1.5" strokeDasharray="6 5"/>

            {/* Entrance */}
            <rect x="170" y="264" width="80" height="14" rx="5"
              fill="rgba(255,255,255,0.22)" stroke="rgba(13,71,43,0.14)" strokeWidth="1"/>
            <text x="210" y="274" textAnchor="middle"
              style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '7px', fill: '#1C231F' }}>
              {tr.entrance}
            </text>

            {/* Zones overlay */}
            {Object.entries(zones).map(([cat, zone]) => (
              <g key={cat}>
                <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="10"
                  fill="rgba(255,255,255,0.03)" stroke="rgba(13,71,43,0.05)" strokeWidth="1" strokeDasharray="4 4"/>
                <text x={zone.x + 10} y={zone.y + 13}
                  style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '8px', fontWeight: 700, fill: 'rgba(13,71,43,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {zone.label}
                </text>
              </g>
            ))}

            {/* Custom Workspace Rendered Tables */}
            {tables.map(tb => {
              const isSel      = tb.id === selId
              const isReserved = tb.status === 'reserved'
              const isHeld     = tb.status === 'held'
              const canClick   = tb.status === 'free'

              const fill   = isSel      ? 'rgba(13,71,43,0.14)'
                           : isHeld     ? 'rgba(255,200,80,0.22)'
                           : isReserved ? 'rgba(200,210,206,0.18)'
                           :              'rgba(255,255,255,0.52)'
              const stroke = isSel      ? '#0D472B'
                           : isHeld     ? 'rgba(180,130,0,0.55)'
                           : isReserved ? 'rgba(180,196,190,0.28)'
                           :              'rgba(13,71,43,0.30)'
              const txtCol = isReserved || isHeld ? 'rgba(120,140,136,0.55)' : isSel ? '#0D472B' : '#1C231F'

              return (
                <g key={tb.id}
                  onClick={() => canClick && handleSelect(tb)}
                  style={{ cursor: canClick ? 'pointer' : 'not-allowed' }}>
                  <rect
                    x={tb.x} y={tb.y} width={tb.w} height={tb.h} rx="9"
                    fill={fill} stroke={stroke}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    filter={isSel ? 'url(#tbl-sel)' : canClick ? 'url(#tbl-glow)' : ''}
                    className={isSel ? 'tbl-pulse' : ''}
                    style={{ transition: 'fill .2s, stroke .2s' }}
                  />
                  {isHeld && (
                    <circle cx={tb.x + tb.w - 7} cy={tb.y + 7} r="4" fill="rgba(190,130,0,0.85)"/>
                  )}
                  <text x={tb.x + tb.w / 2} y={tb.y + tb.h / 2 - 5} textAnchor="middle"
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '10px', fontWeight: 700, fill: txtCol, userSelect: 'none' }}>
                    {tb.name}
                  </text>
                  <text x={tb.x + tb.w / 2} y={tb.y + tb.h / 2 + 8} textAnchor="middle"
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '8px', fill: isReserved || isHeld ? 'rgba(120,140,136,0.45)' : '#6A7A76', userSelect: 'none' }}>
                    {tb.capacity}P
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* Selected Action Card */}
      <div style={{ transition: 'opacity .22s ease, transform .22s ease', opacity: selTable ? 1 : 0, transform: selTable ? 'translateY(0)' : 'translateY(8px)', pointerEvents: selTable ? 'auto' : 'none' }}>
        <div style={{ ...GLASS, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.3) 0%,rgba(255,255,255,0) 100%)', pointerEvents: 'none' }}/>
          <div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '18px', color: '#1C231F', letterSpacing: '-0.02em' }}>
              {lang === 'DE' ? 'Tisch' : 'Table'} {selTable?.name ?? '--'}
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6A7A76', marginTop: '3px' }}>
              {selTable?.capacity ?? '-'} {tr.persons}
              {selTable && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#9AABA6' }}>· {selTable.category}</span>}
            </div>
          </div>
          <button onClick={handleNext} disabled={!selTable || holding}
            style={{ padding: '13px 22px', borderRadius: '16px', background: 'linear-gradient(135deg,#0D472B 0%,#0B3D24 100%)', border: '1.5px solid #0D472B', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: 700, cursor: selTable && !holding ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(13,71,43,0.28), 0 2px 0 rgba(255,255,255,0.25) inset', opacity: holding ? 0.7 : 1 }}>
            {holding ? (lang === 'DE' ? 'Reserviere…' : 'Holding…') : tr.continueDetails}
          </button>
        </div>
      </div>
    </div>
  )
}