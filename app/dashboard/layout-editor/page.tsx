'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, Save, Layers } from 'lucide-react'

interface Zone {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
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
  const canvasWidth = 760
  const canvasHeight = 500

  const [zones, setZones] = useState<Zone[]>([
    { id: '1', label: 'INDOOR',  x: 20,  y: 20,  w: 420, h: 240 },
    { id: '2', label: 'BAR',     x: 460, y: 20,  w: 280, h: 240 },
    { id: '3', label: 'OUTDOOR', x: 20,  y: 280, w: 220, h: 200 },
    { id: '4', label: 'VIP',     x: 260, y: 280, w: 480, h: 200 },
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
  const canvasRef = useRef<SVGSVGElement | null>(null)

  const handleAddZone = () => {
    if (!newZoneLabel.trim()) return
    const id = crypto.randomUUID()
    setZones([
      ...zones,
      { id, label: newZoneLabel.toUpperCase(), x: 80, y: 80, w: 200, h: 140 },
    ])
    newZoneLabel && setNewZoneLabel('')
  }

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTableName.trim()) return
    const id = crypto.randomUUID()
    setTables([
      ...tables,
      { id, name: newTableName, capacity: newTableCap, category: 'UNASSIGNED', x: 60, y: 60, w: 58, h: 44 },
    ])
    setNewTableName('')
  }

  const startDrag = (e: React.MouseEvent, type: 'zone' | 'table', id: string, currentX: number, currentY: number) => {
    e.preventDefault()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setDragItem({ type, id })
    setDragOffset({ x: (e.clientX - rect.left) - currentX, y: (e.clientY - rect.top) - currentY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragItem || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    let targetX = (e.clientX - rect.left) - dragOffset.x
    let targetY = (e.clientY - rect.top) - dragOffset.y

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
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-serif text-zinc-900 font-medium tracking-tight">Interactive Layout Workspace</h1>
          <p className="text-xs text-zinc-500 mt-1">Design sections, customize boundaries freely, and drag elements on the grid.</p>
        </div>
        <button 
          onClick={() => alert('Layout settings blueprint updated successfully!')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-950 text-white shadow-md hover:bg-emerald-900 transition-all"
        >
          <Save size={14} /> Save Configurations
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <div className="xl:col-span-1 space-y-5">
          <div style={GLASS_PANEL} className="p-5 rounded-[24px]">
            <h2 className="text-xs font-bold text-zinc-700 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <Layers size={13} className="text-zinc-500" /> 1. Custom Sections
            </h2>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="e.g., Garden, Terrace" 
                value={newZoneLabel} 
                onChange={e => setNewZoneLabel(e.target.value)}
                className="w-full bg-white/70 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
              <button onClick={handleAddZone} className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition">
                <Plus size={13} /> Add Free Section
              </button>
            </div>
          </div>

          <div style={GLASS_PANEL} className="p-5 rounded-[24px]">
            <h2 className="text-xs font-bold text-zinc-700 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <Plus size={13} className="text-zinc-500" /> 2. Add Tables
            </h2>
            <form onSubmit={handleAddTable} className="space-y-3">
              <input 
                type="text" 
                placeholder="Table Name (e.g., T5)" 
                value={newTableName} 
                onChange={e => setNewTableName(e.target.value)}
                className="w-full bg-white/70 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
              <input 
                type="number" 
                min={1} 
                value={newTableCap} 
                onChange={e => setNewTableCap(parseInt(e.target.value) || 2)}
                className="w-full bg-white/70 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
              <button type="submit" className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition">
                <Plus size={13} /> Add Table Block
              </button>
            </form>
          </div>

          <div style={GLASS_PANEL} className="p-4 rounded-[24px] max-h-[200px] overflow-y-auto space-y-1.5 text-[11px]">
            {zones.map(z => (
              <div key={z.id} className="flex items-center justify-between bg-white/50 px-2.5 py-1.5 rounded-lg border border-zinc-100 font-medium text-zinc-700">
                <span>Section: {z.label}</span>
                <button onClick={() => setZones(zones.filter(x => x.id !== z.id))} className="text-zinc-400 hover:text-red-600"><Trash2 size={12}/></button>
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
          <svg
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="bg-zinc-50 border border-zinc-200 rounded-2xl relative overflow-hidden select-none"
          >
            <defs>
              <pattern id="dot-mesh" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(13,71,43,0.06)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-mesh)" />

            {/* Render Section Areas dynamically */}
            {zones.map((zone) => (
              <g key={zone.id}>
                <rect
                  x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="12"
                  fill="rgba(255,255,255,0.25)" stroke="rgba(13,71,43,0.15)" strokeWidth="1.5" strokeDasharray="4 4"
                  className="cursor-move"
                  onMouseDown={(e) => startDrag(e, 'zone', zone.id, zone.x, zone.y)}
                />
                <text x={zone.x + 12} y={zone.y + 18} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 800, fill: 'rgba(13,71,43,0.45)', textTransform: 'uppercase', pointerEvents: 'none' }}>
                  {zone.label}
                </text>
              </g>
            ))}

            {/* Render Free Move Tables blocks matching layout-2 preview design elements dimensions */}
            {tables.map((tb) => {
              const isDragging = dragItem?.type === 'table' && dragItem.id === tb.id
              return (
                <g key={tb.id} onMouseDown={(e) => startDrag(e, 'table', tb.id, tb.x, tb.y)} className="cursor-grab active:cursor-grabbing">
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
        </div>
      </div>
    </div>
  )
}