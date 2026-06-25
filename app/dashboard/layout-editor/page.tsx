'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Save, Layers, Leaf, ToggleLeft, ToggleRight } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface Zone {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  is_seasonal:  boolean
  season_start: string
  season_end:   string
  is_open:      boolean
}

function isInSeason(z: Zone): boolean {
  if (!z.is_seasonal || !z.season_start || !z.season_end) return true
  const today = new Date().toISOString().slice(0, 10)
  return today >= z.season_start && today <= z.season_end
}

interface TableItem {
  id: string
  name: string
  capacity: number
  category: string
  x: number
  y: number
  w: number
  h: number
}

const GLASS_PANEL: React.CSSProperties = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(30px) saturate(140%)',
  WebkitBackdropFilter: 'blur(30px) saturate(140%)',
  border: '1.5px solid rgba(255,255,255,0.65)',
  boxShadow: '0 10px 40px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.8) inset',
}

export default function LayoutEditorPage() {
  const { lang } = useLang()
  const tx = dashboardT[lang].layout

  const canvasWidth = 760
  const canvasHeight = 500

  const ZONE_DEFAULTS = { is_seasonal: false, season_start: '', season_end: '', is_open: true }

  const [zones, setZones] = useState<Zone[]>([
    { id: '1', label: 'INDOOR',  x: 20,  y: 20,  w: 420, h: 240, ...ZONE_DEFAULTS },
    { id: '2', label: 'BAR',     x: 460, y: 20,  w: 280, h: 240, ...ZONE_DEFAULTS },
    { id: '3', label: 'OUTDOOR', x: 20,  y: 280, w: 220, h: 200, ...ZONE_DEFAULTS },
    { id: '4', label: 'VIP',     x: 260, y: 280, w: 480, h: 200, ...ZONE_DEFAULTS },
  ])

  const [tables, setTables] = useState<TableItem[]>([
    { id: 't1', name: 'T1', capacity: 2, category: 'INDOOR',  x: 50,  y: 70,  w: 58, h: 44 },
    { id: 't2', name: 'T2', capacity: 4, category: 'INDOOR',  x: 140, y: 70,  w: 58, h: 44 },
    { id: 'b1', name: 'B1', capacity: 2, category: 'BAR',     x: 490, y: 70,  w: 58, h: 44 },
    { id: 't4', name: 'T4', capacity: 4, category: 'OUTDOOR', x: 50,  y: 330, w: 58, h: 44 },
  ])

  const [newTableName, setNewTableName] = useState('')
  const [newTableCap, setNewTableCap] = useState(4)
  const [newZoneLabel, setNewZoneLabel] = useState('')

  const [dragItem, setDragItem] = useState<{ type: 'zone' | 'table'; id: string } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeItem, setResizeItem] = useState<{
    id: string
    handle: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'
    startMX: number; startMY: number
    origX: number; origY: number; origW: number; origH: number
  } | null>(null)
  const canvasRef = useRef<SVGSVGElement | null>(null)

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState<string | null>(null)

  useEffect(() => {
    async function loadLayout() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.restaurant_id) { setLoading(false); return }

      const res = await fetch(`/api/layout?restaurantId=${profile.restaurant_id}`)
      if (!res.ok) { setLoading(false); return }

      const data = await res.json()

      if (data.zones?.length > 0) {
        setZones(data.zones.map((z: any) => ({
          id:           z.id,
          label:        z.label,
          x: z.x, y: z.y, w: z.w, h: z.h,
          is_seasonal:  z.is_seasonal  ?? false,
          season_start: z.season_start ?? '',
          season_end:   z.season_end   ?? '',
          is_open:      z.is_open      ?? true,
        })))
      }

      if (data.tables?.length > 0) {
        setTables(data.tables.map((t: any) => ({
          id:       t.id,
          name:     t.name,
          capacity: t.capacity,
          category: t.category,
          x: t.x ?? 60, y: t.y ?? 60,
          w: t.w ?? 58,  h: t.h ?? 44,
        })))
      }

      setLoading(false)
    }
    loadLayout()
  }, [])

  const handleAddZone = () => {
    if (!newZoneLabel.trim()) return
    const id = crypto.randomUUID()
    setZones([
      ...zones,
      { id, label: newZoneLabel.toUpperCase(), x: 80, y: 80, w: 200, h: 140,
        is_seasonal: false, season_start: '', season_end: '', is_open: true },
    ])
    setNewZoneLabel('')
  }

  function toggleZoneOpen(id: string) {
    setZones(prev => prev.map(z => z.id === id ? { ...z, is_open: !z.is_open } : z))
  }

  function toggleSeasonal(id: string) {
    setZones(prev => prev.map(z => z.id === id ? { ...z, is_seasonal: !z.is_seasonal } : z))
  }

  function setSeasonDate(id: string, field: 'season_start' | 'season_end', value: string) {
    setZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z))
  }

  const handleAddTable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newTableName.trim()) return
    const id = crypto.randomUUID()
    setTables([
      ...tables,
      { id, name: newTableName, capacity: newTableCap, category: 'UNASSIGNED', x: 60, y: 60, w: 58, h: 44 },
    ])
    setNewTableName('')
  }

  function getClientXY(e: React.MouseEvent | React.TouchEvent): { clientX: number; clientY: number } {
    if ('touches' in e) {
      return { clientX: e.touches[0]?.clientX ?? 0, clientY: e.touches[0]?.clientY ?? 0 }
    }
    return { clientX: e.clientX, clientY: e.clientY }
  }

  const startDrag = (e: React.MouseEvent | React.TouchEvent, type: 'zone' | 'table', id: string, currentX: number, currentY: number) => {
    e.preventDefault()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const { clientX, clientY } = getClientXY(e)
    setDragItem({ type, id })
    setDragOffset({ x: (clientX - rect.left) - currentX, y: (clientY - rect.top) - currentY })
  }

  const startResize = (
    e: React.MouseEvent | React.TouchEvent,
    id: string,
    handle: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw',
    zone: Zone,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const { clientX, clientY } = getClientXY(e)
    setResizeItem({
      id, handle,
      startMX: clientX - rect.left,
      startMY: clientY - rect.top,
      origX: zone.x, origY: zone.y, origW: zone.w, origH: zone.h,
    })
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const { clientX, clientY } = getClientXY(e)

    if (resizeItem) {
      const dx = (clientX - rect.left) - resizeItem.startMX
      const dy = (clientY - rect.top)  - resizeItem.startMY
      const MIN = 80
      const { origX, origY, origW, origH } = resizeItem
      setZones(prev => prev.map(z => {
        if (z.id !== resizeItem.id) return z
        let x = origX, y = origY, w = origW, h = origH
        const hnd = resizeItem.handle
        if (hnd.includes('e')) w = Math.max(MIN, origW + dx)
        if (hnd.includes('s')) h = Math.max(MIN, origH + dy)
        if (hnd.includes('w')) { x = origX + dx; w = Math.max(MIN, origW - dx) }
        if (hnd.includes('n')) { y = origY + dy; h = Math.max(MIN, origH - dy) }
        if (x < 0) { w = Math.max(MIN, w + x); x = 0 }
        if (y < 0) { h = Math.max(MIN, h + y); y = 0 }
        return { ...z, x, y, w, h }
      }))
      return
    }

    if (!dragItem) return
    let targetX = (clientX - rect.left) - dragOffset.x
    let targetY = (clientY - rect.top) - dragOffset.y
    if (targetX < 0) targetX = 0
    if (targetY < 0) targetY = 0

    if (dragItem.type === 'table') {
      setTables(prev => prev.map(t => t.id === dragItem.id ? { ...t, x: targetX, y: targetY } : t))
    } else {
      setZones(prev => prev.map(z => z.id === dragItem.id ? { ...z, x: targetX, y: targetY } : z))
    }
  }

  const handleMouseUp = () => {
    if (dragItem && dragItem.type === 'table') {
      const activeTable = tables.find(t => t.id === dragItem.id)
      if (activeTable) {
        const cx = activeTable.x + activeTable.w / 2
        const cy = activeTable.y + activeTable.h / 2
        const currentMatchedZone = zones.find(z => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h)
        if (currentMatchedZone) {
          setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, category: currentMatchedZone.label } : t))
        }
      }
    }
    setDragItem(null)
    setResizeItem(null)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-serif text-zinc-900 font-medium tracking-tight">{tx.title}</h1>
          <p className="text-xs text-zinc-500 mt-1">{tx.subtitle}</p>
        </div>
        <button
          onClick={async () => {
            setSaving(true)
            setSaveMsg(null)
            try {
              const res = await fetch('/api/layout', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ zones, tables }),
              })
              const body = await res.json()
              if (!res.ok) { setSaveMsg(`Error: ${body.error}`); return }
              setSaveMsg(tx.saved)
              setTimeout(() => setSaveMsg(null), 3000)
            } catch {
              setSaveMsg(tx.saveFailed)
            } finally {
              setSaving(false)
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-950 text-white shadow-md hover:bg-emerald-900 transition-all"
        >
          <Save size={14} /> {saving ? tx.saving : saveMsg ?? tx.save}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <div className="xl:col-span-1 space-y-5">
          <div style={GLASS_PANEL} className="p-5 rounded-[24px]">
            <h2 className="text-xs font-bold text-zinc-700 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <Layers size={13} className="text-zinc-500" /> {tx.sections}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder={tx.sectionPh}
                value={newZoneLabel} 
                onChange={e => setNewZoneLabel(e.target.value)}
                className="w-full bg-white/70 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
              <button onClick={handleAddZone} className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition">
                <Plus size={13} /> {tx.addSection}
              </button>
            </div>
          </div>

          <div style={GLASS_PANEL} className="p-5 rounded-[24px]">
            <h2 className="text-xs font-bold text-zinc-700 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <Plus size={13} className="text-zinc-500" /> {tx.addTablesTitle}
            </h2>
            <form onSubmit={handleAddTable} className="space-y-3">
              <input
                type="text"
                placeholder={tx.tableNamePh}
                value={newTableName} 
                onChange={e => setNewTableName(e.target.value)}
                className="w-full bg-white/70 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
              <input 
                type="number" 
                min={1} 
                value={newTableCap} 
                onChange={e => {
                  const val = e.target.value
                  setNewTableCap(val === '' ? 0 : parseInt(val))
                }}
                onBlur={() => { if (!newTableCap || newTableCap < 1) setNewTableCap(1) }}
                className="w-full bg-white/70 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
              <button type="submit" className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition">
                <Plus size={13} /> {tx.addTableBlock}
              </button>
            </form>
          </div>

          <div style={GLASS_PANEL} className="p-4 rounded-[24px] max-h-[320px] overflow-y-auto space-y-1.5 text-[11px]">
            {zones.map(z => (
              <div key={z.id} className={`rounded-lg border px-2.5 py-2 space-y-1.5 ${z.is_open ? 'bg-white/50 border-zinc-100' : 'bg-amber-50/60 border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-700">
                    {z.is_seasonal && <Leaf size={10} className="text-emerald-600" />}
                    <span>{z.label}</span>
                    {!z.is_open && <span className="text-amber-600 font-semibold">({tx.closed})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleZoneOpen(z.id)}
                      title={z.is_open ? tx.markClosed : tx.markOpen}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      {z.is_open
                        ? <ToggleRight size={14} className="text-emerald-600" />
                        : <ToggleLeft  size={14} className="text-amber-500" />
                      }
                    </button>
                    <button
                      onClick={() => toggleSeasonal(z.id)}
                      title={z.is_seasonal ? tx.removeSeasonal : tx.markSeasonal}
                      className={z.is_seasonal ? 'text-emerald-600' : 'text-zinc-300 hover:text-emerald-500'}
                    >
                      <Leaf size={11} />
                    </button>
                    <button onClick={() => setZones(zones.filter(x => x.id !== z.id))} className="text-zinc-400 hover:text-red-600">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                {z.is_seasonal && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={z.season_start}
                      onChange={e => setSeasonDate(z.id, 'season_start', e.target.value)}
                      className="flex-1 bg-white border border-zinc-200 rounded-md px-1.5 py-0.5 text-[10px] focus:outline-none"
                      placeholder="Start"
                    />
                    <span className="text-zinc-400">→</span>
                    <input
                      type="date"
                      value={z.season_end}
                      onChange={e => setSeasonDate(z.id, 'season_end', e.target.value)}
                      className="flex-1 bg-white border border-zinc-200 rounded-md px-1.5 py-0.5 text-[10px] focus:outline-none"
                      placeholder="End"
                    />
                  </div>
                )}
              </div>
            ))}
            {tables.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-white/50 px-2.5 py-1.5 rounded-lg border border-zinc-100 text-zinc-600">
                <span>{t.name} ({t.capacity}P) → <span className="text-emerald-800 font-medium">{t.category}</span></span>
                <button onClick={() => setTables(tables.filter(x => x.id !== t.id))} className="text-zinc-400 hover:text-red-600"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 flex flex-col items-center">
          {loading ? (
            <div style={{ width: canvasWidth, height: canvasHeight, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: '#f9fafb', border: '1px solid #e4e7eb', borderRadius: 16 }}>
              <p className="text-xs text-zinc-400">{tx.loadingLayout}</p>
            </div>
          ) : (
          <svg
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            onMouseMove={handleMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleMove}
            onTouchEnd={handleMouseUp}
            style={{ touchAction: 'none' }}
            className="bg-zinc-50 border border-zinc-200 rounded-2xl relative overflow-hidden select-none"
          >
            <defs>
              <pattern id="dot-mesh" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(13,71,43,0.06)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-mesh)" />

            {/* Render Section Areas dynamically */}
            {zones.map((zone) => {
              const closed = !zone.is_open || (zone.is_seasonal && !isInSeason(zone))
              const fill      = closed ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.25)'
              const stroke    = closed ? 'rgba(217,119,6,0.45)'  : 'rgba(13,71,43,0.15)'
              const labelFill = closed ? 'rgba(161,98,7,0.7)'    : 'rgba(13,71,43,0.45)'
              const { x, y, w, h } = zone
              const mx = x + w / 2
              const my = y + h / 2
              const handles: { hnd: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'; cx: number; cy: number; cur: string }[] = [
                { hnd: 'nw', cx: x,      cy: y,      cur: 'nw-resize' },
                { hnd: 'n',  cx: mx,     cy: y,      cur: 'n-resize'  },
                { hnd: 'ne', cx: x + w,  cy: y,      cur: 'ne-resize' },
                { hnd: 'e',  cx: x + w,  cy: my,     cur: 'e-resize'  },
                { hnd: 'se', cx: x + w,  cy: y + h,  cur: 'se-resize' },
                { hnd: 's',  cx: mx,     cy: y + h,  cur: 's-resize'  },
                { hnd: 'sw', cx: x,      cy: y + h,  cur: 'sw-resize' },
                { hnd: 'w',  cx: x,      cy: my,     cur: 'w-resize'  },
              ]
              return (
                <g key={zone.id}>
                  <rect
                    x={x} y={y} width={w} height={h} rx="12"
                    fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray="4 4"
                    style={{ cursor: 'move' }}
                    onMouseDown={(e) => startDrag(e, 'zone', zone.id, x, y)}
                    onTouchStart={(e) => startDrag(e, 'zone', zone.id, x, y)}
                  />
                  <text x={x + 12} y={y + 18} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 800, fill: labelFill, textTransform: 'uppercase', pointerEvents: 'none' }}>
                    {zone.label}{closed ? ' ✕' : ''}
                  </text>
                  {handles.map(({ hnd, cx, cy, cur }) => (
                    <rect
                      key={hnd}
                      x={cx - 5} y={cy - 5} width={10} height={10} rx={2}
                      fill="white"
                      stroke="rgba(13,71,43,0.5)"
                      strokeWidth={1.5}
                      style={{ cursor: cur }}
                      onMouseDown={(e) => startResize(e, zone.id, hnd, zone)}
                      onTouchStart={(e) => startResize(e, zone.id, hnd, zone)}
                    />
                  ))}
                </g>
              )
            })}

            {/* Render Free Move Tables blocks matching layout-2 preview design elements dimensions */}
            {tables.map((tb) => {
              const isDragging = dragItem?.type === 'table' && dragItem.id === tb.id
              return (
                <g key={tb.id}
                  onMouseDown={(e) => startDrag(e, 'table', tb.id, tb.x, tb.y)}
                  onTouchStart={(e) => startDrag(e, 'table', tb.id, tb.x, tb.y)}
                  className="cursor-grab active:cursor-grabbing">
                  <rect
                    x={tb.x} y={tb.y} width={tb.w} height={tb.h} rx="9"
                    fill={isDragging ? 'rgba(13,71,43,0.1)' : 'rgba(255,255,255,0.85)'}
                    stroke={isDragging ? '#0D472B' : 'rgba(13,71,43,0.25)'}
                    strokeWidth={isDragging ? 2.5 : 1.5}
                  />
                  <text x={tb.x + tb.w / 2} y={tb.y + tb.h / 2 - 4} textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, fill: '#1C231F', pointerEvents: 'none' }}>
                    {tb.name}
                  </text>
                  <text x={tb.x + tb.w / 2} y={tb.y + tb.h / 2 + 8} textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', fill: '#6A7A76', pointerEvents: 'none' }}>
                    {tb.capacity}P
                  </text>
                </g>
              )
            })}
          </svg>
          )}
        </div>
      </div>
    </div>
  )
}