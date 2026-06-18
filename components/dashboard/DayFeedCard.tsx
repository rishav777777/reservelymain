'use client'
import { useState } from "react"
import { Users, Clock, MessageSquare, Baby, Cake, AlertCircle, X, Check, Star, UserCheck, UserX, ChevronDown, ChevronUp } from "lucide-react"

export interface Reservation {
  id: string
  name: string
  von: string
  bis: string
  guests: number
  note?: string
  noteIcon?: "baby" | "cake" | "allergy" | "vip" | "generic"
  status: "pending" | "confirmed" | "declined" | "arrived" | "no_show" | "completed" | "cancelled"
  initials: string
}

interface DayFeedCardProps {
  reservation: Reservation
  onConfirm:  (id: string, reply: string) => void
  onDecline:  (id: string, reply: string) => void
  onArrived?: (id: string) => void
  onNoShow?:  (id: string) => void
}

const ICON_MAP = {
  baby:    Baby,
  cake:    Cake,
  allergy: AlertCircle,
  vip:     Star,
  generic: MessageSquare,
}

const AVATAR_PALETTES = [
  { bg: "#D4E8DC", text: "#0D472B" },
  { bg: "#E8D4D4", text: "#6B1A1A" },
  { bg: "#D4DCE8", text: "#1A2D6B" },
  { bg: "#E8E4D4", text: "#5C4A1A" },
  { bg: "#DCE8D4", text: "#2A5C1A" },
]

function avatarColor(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length]
}

const STATUS_CONFIG = {
  pending:   { label: null,               bg: null,                          border: null,                           textColor: null },
  confirmed: { label: 'Bestätigt',        bg: 'rgba(27,122,67,0.1)',         border: '1px solid rgba(27,122,67,0.15)',    textColor: '#1B7A43' },
  declined:  { label: 'Abgelehnt',        bg: 'rgba(168,41,41,0.08)',        border: '1px solid rgba(168,41,41,0.12)',    textColor: '#A82929' },
  arrived:   { label: 'Angekommen',       bg: 'rgba(13,71,43,0.12)',         border: '1px solid rgba(13,71,43,0.2)',      textColor: '#0D472B' },
  no_show:   { label: 'Nicht erschienen', bg: 'rgba(120,100,30,0.1)',        border: '1px solid rgba(120,100,30,0.2)',    textColor: '#7a6020' },
  completed: { label: 'Abgeschlossen',    bg: 'rgba(100,120,110,0.08)',      border: '1px solid rgba(100,120,110,0.15)', textColor: '#4a6058' },
  cancelled: { label: 'Storniert',        bg: 'rgba(168,41,41,0.08)',        border: '1px solid rgba(168,41,41,0.12)',    textColor: '#A82929' },
}

const CARD_BG = {
  pending:   'rgba(255,255,255,0.55)',
  confirmed: 'rgba(235,248,240,0.7)',
  declined:  'rgba(252,238,238,0.6)',
  arrived:   'rgba(220,240,228,0.75)',
  no_show:   'rgba(248,244,220,0.65)',
  completed: 'rgba(240,242,240,0.65)',
  cancelled: 'rgba(252,238,238,0.6)',
}

const CARD_BORDER = {
  pending:   '1px solid rgba(255,255,255,0.82)',
  confirmed: '1.5px solid rgba(27,122,67,0.3)',
  declined:  '1.5px solid rgba(168,41,41,0.2)',
  arrived:   '1.5px solid rgba(13,71,43,0.35)',
  no_show:   '1.5px solid rgba(120,100,30,0.25)',
  completed: '1.5px solid rgba(100,120,110,0.2)',
  cancelled: '1.5px solid rgba(168,41,41,0.2)',
}

export function DayFeedCard({ reservation, onConfirm, onDecline, onArrived, onNoShow }: DayFeedCardProps) {
  const [reply,       setReply]       = useState("")
  const [actioned,    setActioned]    = useState(false)
  const [expanded,    setExpanded]    = useState(false)
  const [localStatus, setLocalStatus] = useState(reservation.status)

  const palette  = avatarColor(reservation.initials)
  const NoteIcon = ICON_MAP[reservation.noteIcon ?? "generic"]

  const isPending   = localStatus === "pending"
  const isConfirmed = localStatus === "confirmed"
  const isArrived   = localStatus === "arrived"
  const isDone      = ["declined", "no_show", "completed", "cancelled"].includes(localStatus)

  const cfg = STATUS_CONFIG[localStatus] ?? STATUS_CONFIG.confirmed

  function handleConfirm() {
    setActioned(true)
    setTimeout(() => {
      onConfirm(reservation.id, reply)
      setLocalStatus("confirmed")
      setActioned(false)
    }, 400)
  }

  function handleDecline() {
    setActioned(true)
    setTimeout(() => {
      onDecline(reservation.id, reply)
      setLocalStatus("declined")
      setActioned(false)
    }, 400)
  }

  function handleArrived() {
    setActioned(true)
    setTimeout(() => {
      onArrived?.(reservation.id)
      setLocalStatus("arrived")
      setActioned(false)
    }, 300)
  }

  function handleNoShow() {
    setActioned(true)
    setTimeout(() => {
      onNoShow?.(reservation.id)
      setLocalStatus("no_show")
      setActioned(false)
    }, 300)
  }

  const showBody = isPending || isDone || isArrived || expanded

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-500"
      style={{
        background: CARD_BG[localStatus] ?? CARD_BG.confirmed,
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: CARD_BORDER[localStatus] ?? CARD_BORDER.confirmed,
        boxShadow: isPending
          ? "0 4px 32px rgba(28,35,31,0.1), 0 1px 4px rgba(28,35,31,0.06)"
          : "0 2px 16px rgba(28,35,31,0.07)",
        opacity: actioned ? 0.5 : 1,
        transform: actioned ? "scale(0.98)" : "scale(1)",
        transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
        pointerEvents: actioned ? "none" : "auto",
      }}
    >
      {/* Status banner (non-pending) */}
      {!isPending && cfg.label && (
        <div
          className="flex items-center justify-between px-6 py-2.5"
          onClick={() => isConfirmed && setExpanded(v => !v)}
          style={{
            background: cfg.bg ?? '',
            borderBottom: cfg.border ?? '',
            cursor: isConfirmed ? 'pointer' : 'default',
          }}
        >
          <div className="flex items-center gap-2">
            {localStatus === 'confirmed'  && <Check     size={14} strokeWidth={2.5} style={{ color: cfg.textColor! }} />}
            {localStatus === 'arrived'    && <UserCheck  size={14} strokeWidth={2.5} style={{ color: cfg.textColor! }} />}
            {localStatus === 'no_show'    && <UserX      size={14} strokeWidth={2.5} style={{ color: cfg.textColor! }} />}
            {(localStatus === 'declined' || localStatus === 'cancelled') && <X size={14} strokeWidth={2.5} style={{ color: cfg.textColor! }} />}
            {localStatus === 'completed'  && <Check      size={14} strokeWidth={2.5} style={{ color: cfg.textColor! }} />}
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 700,
              color: cfg.textColor!, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              {cfg.label}
            </span>
          </div>
          {isConfirmed && (
            <div style={{ color: cfg.textColor!, opacity: 0.6 }}>
              {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </div>
          )}
        </div>
      )}

      {/* Main header (always visible) */}
      <div
        className="flex items-center gap-4 px-6 pt-5 pb-4"
        onClick={() => isConfirmed && setExpanded(v => !v)}
        style={{ cursor: isConfirmed ? 'pointer' : 'default' }}
      >
        <div className="flex items-center justify-center rounded-2xl shrink-0" style={{ width: 56, height: 56, background: palette.bg, fontFamily: "'DM Sans', sans-serif", fontSize: "18px", fontWeight: 700, color: palette.text, flexShrink: 0 }}>
          {reservation.initials}
        </div>

        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 500, color: "#1C231F", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {reservation.name}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock size={14} strokeWidth={2} style={{ color: "#5a6b60", flexShrink: 0 }}/>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 600, color: "#1C231F", letterSpacing: "0.01em" }}>
                {reservation.von} – {reservation.bis} Uhr
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} strokeWidth={2} style={{ color: "#5a6b60", flexShrink: 0 }}/>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 600, color: "#1C231F" }}>
                {reservation.guests} {reservation.guests === 1 ? "Person" : "Personen"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center rounded-2xl shrink-0" style={{ width: 56, height: 56, background: "rgba(13,71,43,0.08)", border: "1px solid rgba(13,71,43,0.12)" }}>
          <div className="flex flex-col items-center">
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "22px", fontWeight: 800, color: "#0D472B", lineHeight: 1 }}>{reservation.guests}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "9px", fontWeight: 600, color: "#5a6b60", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "1px" }}>Pers.</span>
          </div>
        </div>
      </div>

      {/* Expandable body */}
      {showBody && (
        <>
          {reservation.note && (
            <div className="px-6 pb-4">
              <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: "rgba(13,71,43,0.05)", border: "1px solid rgba(13,71,43,0.1)" }}>
                <NoteIcon size={16} strokeWidth={2} style={{ color: "#1B7A43", marginTop: "2px", flexShrink: 0 }}/>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 500, color: "#2a3d30", lineHeight: 1.6 }}>
                  {reservation.note}
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <>
              <div className="px-6 pb-4">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Antwort-Notiz an Gast (z.B. Tisch am Fenster ist reserviert)"
                  rows={2}
                  className="w-full resize-none outline-none rounded-xl px-4 py-3.5 transition-all duration-200"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#1C231F", background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(28,35,31,0.12)", lineHeight: 1.55 }}
                  onFocus={e => { e.target.style.background = "rgba(255,255,255,0.95)"; e.target.style.borderColor = "rgba(13,71,43,0.35)"; e.target.style.boxShadow = "0 0 0 3px rgba(13,71,43,0.08)" }}
                  onBlur={e => { e.target.style.background = "rgba(255,255,255,0.7)"; e.target.style.borderColor = "rgba(28,35,31,0.12)"; e.target.style.boxShadow = "none" }}
                />
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={handleDecline} className="flex-1 flex items-center justify-center gap-2.5 rounded-xl active:scale-95"
                  style={{ height: 64, background: "#A82929", border: "none", boxShadow: "0 4px 16px rgba(168,41,41,0.3)", transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#C23030" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#A82929" }}>
                  <X size={20} color="#fff" strokeWidth={2.5}/>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "17px", fontWeight: 700, color: "#fff", letterSpacing: "0.03em" }}>Ablehnen</span>
                </button>
                <button onClick={handleConfirm} className="flex-1 flex items-center justify-center gap-2.5 rounded-xl active:scale-95"
                  style={{ height: 64, background: "#1B7A43", border: "none", boxShadow: "0 4px 16px rgba(27,122,67,0.35)", transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#22964F" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#1B7A43" }}>
                  <Check size={20} color="#fff" strokeWidth={2.5}/>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "17px", fontWeight: 700, color: "#fff", letterSpacing: "0.03em" }}>Bestätigen</span>
                </button>
              </div>
            </>
          )}

          {isConfirmed && (
            <div className="flex gap-3 px-6 pb-6 pt-1">
              <button onClick={handleNoShow} className="flex-1 flex items-center justify-center gap-2 rounded-xl active:scale-95"
                style={{ height: 52, background: "rgba(120,100,30,0.1)", border: "1.5px solid rgba(120,100,30,0.25)", transition: "all .15s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(120,100,30,0.18)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(120,100,30,0.1)" }}>
                <UserX size={16} strokeWidth={2.5} style={{ color: "#7a6020" }}/>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#7a6020", letterSpacing: "0.02em" }}>
                  Nicht erschienen
                </span>
              </button>
              <button onClick={handleArrived} className="flex-1 flex items-center justify-center gap-2 rounded-xl active:scale-95"
                style={{ height: 52, background: "rgba(13,71,43,0.10)", border: "1.5px solid rgba(13,71,43,0.25)", transition: "all .15s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(13,71,43,0.18)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(13,71,43,0.10)" }}>
                <UserCheck size={16} strokeWidth={2.5} style={{ color: "#0D472B" }}/>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#0D472B", letterSpacing: "0.02em" }}>
                  Angekommen
                </span>
              </button>
            </div>
          )}

          {(isArrived || isDone) && !isPending && !isConfirmed && (
            <div style={{ height: 20 }}/>
          )}
        </>
      )}
    </div>
  )
}