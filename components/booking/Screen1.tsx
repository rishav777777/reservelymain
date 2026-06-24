'use client';

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { type Lang, t } from "./translations";

const TIMES_FALLBACK = [
  "17:00","17:30","18:00","18:30","19:00",
  "19:30","20:00","20:30","21:00","21:30","22:00",
];

function generateTimes(open: string, last: string): string[] {
  const slots: string[] = [];
  const [oh, om] = open.split(":").map(Number);
  const [lh, lm] = last.split(":").map(Number);
  let cur = oh * 60 + om;
  const end = lh * 60 + lm;
  while (cur <= end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
    cur += 30;
  }
  return slots;
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number)    { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function getDow(y: number, m: number, d: number) { const w = new Date(y, m, d).getDay(); return w === 0 ? 6 : w - 1; }

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(40px) saturate(160%)",
  WebkitBackdropFilter: "blur(40px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "22px",
};

interface Props {
  lang: Lang;
  onNext: (date: string, timeFrom: string, timeTill: string | null, rawDate: string) => void;
  closedDays?: Set<number>;
  advanceBookingDays?: number;
  openingHoursMap?: Record<number, { open: string; last: string | null }>;
  partySize: number;
  onPartySizeChange: (n: number) => void;
  maxPartySize?: number;
}

export function Screen1({
  lang, onNext, closedDays, advanceBookingDays = 90,
  openingHoursMap, partySize, onPartySizeChange, maxPartySize,
}: Props) {
  const tr = t[lang] || t["DE"];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [selDate,  setSelDate]  = useState<number | null>(null);
  const [selTime,  setSelTime]  = useState<string | null>(null);
  const [showTime, setShowTime] = useState(false);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + advanceBookingDays);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const isMaxMonth     = year === maxDate.getFullYear() && month === maxDate.getMonth();
  const daysInMonth    = getDaysInMonth(year, month);
  const firstDay       = getFirstDow(year, month);
  const monthName      = new Date(year, month, 1).toLocaleString(
    lang === "DE" ? "de-DE" : "en-US", { month: "long" }
  );

  const isClosed  = (d: number) => { const w = getDow(year, month, d); return closedDays ? closedDays.has(w) : w === 0 || w === 1; };
  const isPast    = (d: number) => new Date(year, month, d) < today;
  const isBeyond  = (d: number) => new Date(year, month, d) > maxDate;
  const disabled  = (d: number) => isPast(d) || isBeyond(d) || isClosed(d);

  const availableTimes = useMemo(() => {
    if (selDate !== null && openingHoursMap) {
      const dow = getDow(year, month, selDate);
      const h = openingHoursMap[dow];
      if (h?.open && h?.last) return generateTimes(h.open, h.last);
    }
    return TIMES_FALLBACK;
  }, [selDate, year, month, openingHoursMap]);

  function prevMonth() {
    if (isCurrentMonth) return;
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else             { setMonth(m => m - 1); }
    setSelDate(null); setSelTime(null); setShowTime(false);
  }

  function nextMonth() {
    if (isMaxMonth) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else              { setMonth(m => m + 1); }
    setSelDate(null); setSelTime(null); setShowTime(false);
  }

  function pickDate(day: number) {
    if (disabled(day)) return;
    setSelDate(day);
    setSelTime(null);
    // Auto-select the first available time slot
    let firstSlot: string | null = null;
    if (openingHoursMap) {
      const dow = getDow(year, month, day);
      const h = openingHoursMap[dow];
      if (h?.open && h?.last) {
        const times = generateTimes(h.open, h.last);
        if (times.length) firstSlot = times[0];
      }
    }
    if (!firstSlot && TIMES_FALLBACK.length) firstSlot = TIMES_FALLBACK[0];
    setSelTime(firstSlot);
    setShowTime(true);
  }

  function handleNext() {
    if (!selDate || !selTime) return;
    const rawDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(selDate).padStart(2, "0")}`;
    const d = new Date(year, month, selDate);
    onNext(
      d.toLocaleDateString(lang === "DE" ? "de-DE" : "en-US", { day: "numeric", month: "long" }),
      selTime,
      null,
      rawDate,
    );
  }

  const canNext = selDate !== null && selTime !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>

      {/* ── CALENDAR ───────────────────────────────────────────────────── */}
      <div style={CARD}>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 18px 14px" }}>
          <button onClick={prevMonth} disabled={isCurrentMonth} style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isCurrentMonth ? "not-allowed" : "pointer", opacity: isCurrentMonth ? 0.25 : 1,
            transition: "all .15s",
          }}>
            <ChevronLeft size={15} color="#fff" strokeWidth={2.5} />
          </button>

          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "19px", color: "#fff" }}>
            {monthName} {year}
          </span>

          <button onClick={nextMonth} disabled={isMaxMonth} style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isMaxMonth ? "not-allowed" : "pointer", opacity: isMaxMonth ? 0.25 : 1,
            transition: "all .15s",
          }}>
            <ChevronRight size={15} color="#fff" strokeWidth={2.5} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 14px 8px" }}>
          {(tr?.days || ["Mo","Di","Mi","Do","Fr","Sa","So"]).map((d, i) => (
            <div key={d} style={{
              textAlign: "center",
              fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600,
              color: i >= 5 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.35)",
              paddingBottom: "6px",
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 14px 18px", rowGap: "3px" }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day    = i + 1;
            const isSel  = day === selDate;
            const isDis  = disabled(day);
            const isCls  = isClosed(day);
            const isPst  = isPast(day);
            const isTod  = isCurrentMonth && day === today.getDate();
            return (
              <button key={day} onClick={() => pickDate(day)} disabled={isDis}
                style={{
                  width: "38px", height: "38px", borderRadius: "50%", margin: "0 auto",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                  fontWeight: isSel ? 700 : isTod ? 600 : 400,
                  background: isSel
                    ? "linear-gradient(135deg, #34D399, #059669)"
                    : isTod && !isSel ? "rgba(255,255,255,0.09)" : "transparent",
                  color: isSel ? "#022c22"
                    : isPst || isCls ? "rgba(255,255,255,0.17)"
                    : "#fff",
                  border: isTod && !isSel ? "1.5px solid rgba(52,211,153,0.30)" : "none",
                  cursor: isDis ? "not-allowed" : "pointer",
                  boxShadow: isSel ? "0 0 14px rgba(52,211,153,0.40)" : "none",
                  textDecoration: isCls && !isPst ? "line-through rgba(255,255,255,0.20) 1.5px" : "none",
                  transition: "all .12s ease",
                }}>
                {day}
              </button>
            );
          })}
        </div>

        {/* Selected date row */}
        {selDate && (
          <div style={{
            margin: "0 14px 18px",
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.18)",
            borderRadius: "12px",
            padding: "10px 14px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399", flexShrink: 0 }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#fff", fontWeight: 500, flex: 1 }}>
              {new Date(year, month, selDate).toLocaleDateString(lang === "DE" ? "de-DE" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <button onClick={() => { setSelDate(null); setSelTime(null); setShowTime(false); }}
              style={{ fontSize: "11px", color: "rgba(255,255,255,0.30)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── TIME CHIPS ─────────────────────────────────────────────────── */}
      {showTime && selDate && (
        <div style={{ ...CARD, padding: "18px" }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "10px", fontWeight: 700,
            color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em",
            margin: "0 0 14px",
          }}>
            {tr?.chooseTime || (lang === "DE" ? "Uhrzeit wählen" : "Select a time")}
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {availableTimes.map(time => {
              const active = selTime === time;
              return (
                <button key={time} onClick={() => setSelTime(time)} style={{
                  padding: "9px 16px", borderRadius: "12px",
                  background: active ? "linear-gradient(135deg, #34D399 0%, #059669 100%)" : "rgba(255,255,255,0.07)",
                  border: active ? "1px solid rgba(52,211,153,0.60)" : "1px solid rgba(255,255,255,0.10)",
                  color: active ? "#022c22" : "#fff",
                  fontFamily: "'DM Serif Display', serif", fontSize: "16px",
                  fontWeight: active ? 700 : 400,
                  cursor: "pointer",
                  boxShadow: active ? "0 0 14px rgba(52,211,153,0.35)" : "none",
                  transition: "all .12s ease",
                  letterSpacing: "-0.01em",
                }}>
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PARTY SIZE ─────────────────────────────────────────────────── */}
      {selTime && (
        <div style={{ ...CARD, padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
            <Users size={13} color="rgba(255,255,255,0.35)" strokeWidth={2.5} />
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "10px", fontWeight: 700,
              color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
            }}>
              {lang === "DE" ? "Personenanzahl" : "Party size"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Array.from({ length: Math.min(8, maxPartySize ?? 8) }, (_, i) => i + 1).map(n => {
              const active = partySize === n;
              return (
                <button key={n} onClick={() => onPartySizeChange(n)} style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: active ? "linear-gradient(135deg, #34D399 0%, #059669 100%)" : "rgba(255,255,255,0.07)",
                  border: active ? "1px solid rgba(52,211,153,0.60)" : "1px solid rgba(255,255,255,0.10)",
                  color: active ? "#022c22" : "#fff",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: active ? 700 : 400,
                  cursor: "pointer",
                  boxShadow: active ? "0 0 12px rgba(52,211,153,0.35)" : "none",
                  transition: "all .12s ease",
                }}>
                  {n}
                </button>
              );
            })}
            {(!maxPartySize || maxPartySize > 8) && (
              <button
                onClick={() => {
                  const val = parseInt(
                    prompt(lang === "DE" ? "Wie viele Personen?" : "How many guests?") ?? "", 10
                  );
                  if (!isNaN(val) && val > 0 && (!maxPartySize || val <= maxPartySize))
                    onPartySizeChange(val);
                }}
                style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: partySize > 8 ? "linear-gradient(135deg, #34D399 0%, #059669 100%)" : "rgba(255,255,255,0.07)",
                  border: partySize > 8 ? "1px solid rgba(52,211,153,0.60)" : "1px solid rgba(255,255,255,0.10)",
                  color: partySize > 8 ? "#022c22" : "rgba(255,255,255,0.35)",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "12px",
                  cursor: "pointer", transition: "all .12s ease",
                }}>
                {partySize > 8 ? partySize : "+"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── NEXT CTA ───────────────────────────────────────────────────── */}
      <button
        onClick={handleNext}
        disabled={!canNext}
        style={{
          width: "100%", padding: "17px", borderRadius: "18px", marginTop: "4px",
          background: canNext
            ? "linear-gradient(135deg, #34D399 0%, #059669 100%)"
            : "rgba(255,255,255,0.05)",
          border: canNext ? "1px solid rgba(52,211,153,0.50)" : "1px solid rgba(255,255,255,0.08)",
          color: canNext ? "#022c22" : "rgba(255,255,255,0.20)",
          fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 800,
          cursor: canNext ? "pointer" : "not-allowed",
          boxShadow: canNext ? "0 8px 28px rgba(52,211,153,0.30)" : "none",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          letterSpacing: "0.01em",
          transition: "all .2s ease",
        }}>
        {canNext
          ? (lang === "DE" ? "Tisch auswählen →" : "Choose a table →")
          : (lang === "DE" ? "Datum und Uhrzeit wählen" : "Select date & time above")}
      </button>

    </div>
  );
}
