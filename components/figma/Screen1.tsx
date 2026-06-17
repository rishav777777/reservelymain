'use client';

import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { type Lang, t } from "./translations";
import { TimeWheel } from "./TimeWheel";

const TIMES = [
  "17:00","17:30","18:00","18:30","19:00",
  "19:30","20:00","20:30","21:00","21:30","22:00",
];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function getDow(y: number, m: number, d: number) { const w = new Date(y, m, d).getDay(); return w === 0 ? 6 : w - 1; }

const GLASS: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.07)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1.5px solid rgba(255, 255, 255, 0.12)",
  boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.1) inset",
  borderRadius: "28px",
};

type Phase = "calendar" | "waiting" | "time";

interface Props {
  lang: Lang;
  onNext: (date: string, timeFrom: string, timeTill: string | null, rawDate: string) => void;
}

export function Screen1({ lang, onNext }: Props) {
  const tr = t[lang] || t["DE"];
  
  const today = new Date();
  const Y = today.getFullYear(), M = today.getMonth();

  const [phase,    setPhase]    = useState<Phase>("calendar");
  const [selDate,  setSelDate]  = useState<number | null>(null);
  const [timeFrom, setTimeFrom] = useState<string>("19:00");
  const [timeTill, setTimeTill] = useState<string | null>(null);

  const addMinutes = (tStr: string, m: number): string => {
    const [h, min] = tStr.split(":").map(Number);
    const total = h * 60 + min + m;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };
  const minTill = addMinutes(timeFrom, 30);

  const daysInMonth = getDaysInMonth(Y, M);
  const firstDay    = getFirstDow(Y, M);
  const monthName   = new Date(Y, M, 1).toLocaleString(
    lang === "DE" ? "de-DE" : "en-US", { month: "long" }
  );

  const closed   = (d: number) => { const w = getDow(Y, M, d); return w === 0 || w === 1; };
  const past     = (d: number) => d < today.getDate();
  const disabled = (d: number) => past(d) || closed(d);

  const pickDate = (day: number) => {
    if (disabled(day)) return;
    setSelDate(day);
    setPhase("waiting");
    setTimeout(() => setPhase("time"), 1000);
  };

  const backToCal = () => {
    setPhase("calendar");
    setSelDate(null);
  };

  const canNext = selDate !== null && phase === "time";

  const handleNext = () => {
    if (!canNext) return;
    const d = new Date(Y, M, selDate!);
    const rawDate = `${Y}-${String(M + 1).padStart(2, '0')}-${String(selDate).padStart(2, '0')}`;
    onNext(
      d.toLocaleDateString(lang === "DE" ? "de-DE" : "en-US", { day: "numeric", month: "long" }),
      timeFrom,
      timeTill,
      rawDate,
    );
  };

  const calVisible  = phase === "calendar" || phase === "waiting";
  const timeVisible = phase === "time";
  const waiting     = phase === "waiting";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", minWidth: "100%" }}>

      {/* ── MASTER GLASS CARD ─────────────────────────────────────── */}
      <div style={{ ...GLASS, position: "relative", overflow: "hidden", minHeight: "440px", width: "100%" }}>

        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "50px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: "28px 28px 0 0", pointerEvents: "none", zIndex: 4,
        }}/>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "24px",
          background: "linear-gradient(0deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: "0 0 28px 28px", pointerEvents: "none", zIndex: 4,
        }}/>

        {/* ── CALENDAR VIEW ─────────────────────────── */}
        <div style={{
          padding: "26px 24px 24px",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          opacity: calVisible ? 1 : 0,
          transform: calVisible ? (waiting ? "scale(0.98)" : "scale(1)") : "scale(0.95) translateY(-10px)",
          pointerEvents: calVisible && !waiting ? "auto" : "none",
          position: "absolute", inset: 0,
          width: "100%",
        }}>
          {waiting && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 5, borderRadius: "28px",
              background: "rgba(6,21,13,0.4)",
              animation: "pulse 0.8s ease-in-out infinite alternate",
            }}>
              <style>{`@keyframes pulse{from{opacity:0.4}to{opacity:0.7}}`}</style>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "20px", color: "#FFF", letterSpacing: "-0.01em" }}>
              {monthName} {Y}
            </span>
            <span style={{ fontFamily: "'DM Sans',sans-serif", color: "#A0B8B0", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
              {tr?.chooseDate || "DATUM WÄHLEN"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "14px" }}>
            {(tr?.days || ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]).map((d, i) => (
              <div key={d} style={{
                textAlign: "center",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: i >= 5 ? "rgba(220,245,230,0.3)" : "#A0B8B0",
                letterSpacing: "0.02em",
                paddingBottom: "8px",
              }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: "8px" }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSel = day === selDate;
              const isDis = disabled(day);
              const isCls = closed(day);
              const isTod = day === today.getDate();
              return (
                <button key={day} onClick={() => pickDate(day)} disabled={isDis}
                  style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'DM Sans',sans-serif", fontSize: "13px",
                    fontWeight: isSel ? 700 : isTod ? 700 : 400,
                    background: isSel
                      ? "linear-gradient(135deg,#00E676,#0D472B)"
                      : isTod && !isSel ? "rgba(255,255,255,0.1)" : "transparent",
                    color: isSel ? "#000"
                      : isCls ? "rgba(255,255,255,0.15)"
                      : isDis ? "rgba(255,255,255,0.25)"
                      : "#FFF",
                    border: isTod && !isSel ? "1.5px solid rgba(0,230,118,0.3)" : "none",
                    cursor: isDis ? "not-allowed" : "pointer",
                    boxShadow: isSel ? "0 0 15px rgba(0,230,118,0.4)" : "none",
                    textDecoration: isCls && !past(day) ? "line-through" : "none",
                    transition: "all .15s ease",
                  }}>
                  {day}
                </button>
              );
            })}
          </div>

          {selDate && (
            <div style={{
              marginTop: "24px",
              padding: "12px 16px",
              background: "rgba(13,71,43,0.2)",
              border: "1px solid rgba(0,230,118,0.2)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00E676", flexShrink: 0 }}/>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#FFF", fontWeight: 500 }}>
                {new Date(Y, M, selDate).toLocaleDateString(lang === "DE" ? "de-DE" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "#00E676", marginLeft: "auto", fontWeight: 700 }}>
                {waiting ? (lang === "DE" ? "Lädt…" : "Loading…") : "✓"}
              </span>
            </div>
          )}
        </div>

        {/* ── TIME WHEEL VIEW ────────────────────────── */}
        <div style={{
          padding: "26px 24px 28px",
          transition: "opacity 0.45s ease, transform 0.45s ease",
          opacity: timeVisible ? 1 : 0,
          transform: timeVisible ? "scale(1) translateY(0)" : "scale(0.96) translateY(14px)",
          pointerEvents: timeVisible ? "auto" : "none",
          position: "absolute", inset: 0,
          width: "100%",
        }}>
          <button onClick={backToCal} style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: "none", border: "none", cursor: "pointer",
            padding: "0 0 16px", fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#A0B8B0",
          }}>
            <ChevronLeft size={14} color="#A0B8B0" strokeWidth={2.5}/>
            {lang === "DE" ? "Datum ändern" : "Change date"}
            {selDate && (
              <span style={{ color: "#00E676", fontWeight: 700, marginLeft: "6px" }}>
                — {new Date(Y, M, selDate).toLocaleDateString(lang === "DE" ? "de-DE" : "en-US", { day: "numeric", month: "short" })}
              </span>
            )}
          </button>

          <p style={{
            fontFamily: "'DM Sans',sans-serif", color: "#A0B8B0",
            fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: "18px", fontWeight: 700
          }}>
            {tr?.chooseTime || "UHRZEIT WÄHLEN"}
          </p>

          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", width: "100%" }}>
            <TimeWheel
              times={TIMES}
              value={timeFrom}
              onChange={(v) => {
                if (v) {
                  setTimeFrom(v);
                  if (timeTill) {
                    const newMin = addMinutes(v, 30);
                    const [th, tm] = timeTill.split(":").map(Number);
                    const [nh, nm] = newMin.split(":").map(Number);
                    if (th * 60 + tm < nh * 60 + nm) setTimeTill(null);
                  }
                }
              }}
              label={lang === "DE" ? "Von" : "From"}
            />

            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", paddingTop: "52px", gap: "6px", flexShrink: 0,
            }}>
              <div style={{ width: "1px", height: "45px", background: "rgba(255,255,255,0.1)" }}/>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: "#A0B8B0", letterSpacing: "0.05em" }}>—</span>
              <div style={{ width: "1px", height: "45px", background: "rgba(255,255,255,0.1)" }}/>
            </div>

            <TimeWheel
              times={TIMES}
              value={timeTill}
              onChange={setTimeTill}
              label={lang === "DE" ? "Bis" : "Till"}
              optional
              nichtSicher
              nichtSicherLabel={lang === "DE" ? "Nicht sicher" : "Not sure"}
              lockedBefore={minTill}
            />
          </div>
        </div>
      </div>

      {/* NEXT BUTTON */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
        <button onClick={handleNext} disabled={!canNext} style={{
          width: "60px", height: "60px", borderRadius: "50%",
          background: canNext ? "linear-gradient(135deg,#00E676 0%,#0D472B 100%)" : "rgba(255,255,255,0.05)",
          border: canNext ? "1px solid #00E676" : "1.5px solid rgba(255,255,255,0.1)",
          boxShadow: canNext ? "0 10px 25px rgba(0,230,118,0.25)" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: canNext ? "pointer" : "not-allowed",
          transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          <ChevronRight size={24} color={canNext ? "#000" : "rgba(255,255,255,0.25)"} strokeWidth={3}/>
        </button>
      </div>
    </div>
  );
}