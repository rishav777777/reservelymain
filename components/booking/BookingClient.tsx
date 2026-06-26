'use client';

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Screen1 } from "@/components/booking/Screen1";
import { Screen2 } from "@/components/booking/Screen2";
import { Screen3 } from "@/components/booking/Screen3";
import { type Lang, t } from "@/components/booking/translations";

type Screen = "date" | "table" | "details";
const STEPS: Screen[] = ["date", "table", "details"];

interface BookingClientProps {
  restaurantId:        string
  restaurantSlug:      string
  restaurantName:      string
  closedDays?:         Set<number>
  advanceBookingDays?: number
  openingHoursMap?:    Record<number, { open: string; last: string | null }>
  maxPartySize?:       number
  defaultDuration?:    number
  demoMode?:           boolean
}

export function BookingClient({
  restaurantId, restaurantSlug, restaurantName,
  closedDays, advanceBookingDays, openingHoursMap, maxPartySize,
  defaultDuration = 90,
  demoMode = false,
}: BookingClientProps) {
  const [screen,    setScreen]    = useState<Screen>("date");
  const [lang,      setLang]      = useState<Lang>("EN");

  useEffect(() => {
    const stored = localStorage.getItem('reservely-lang')
    if (stored === 'DE') setLang('DE')
  }, []);
  const [dateStr,   setDateStr]   = useState("");
  const [rawDate,   setRawDate]   = useState("");
  const [timeStr,   setTimeStr]   = useState("");
  const [tableId,   setTableId]   = useState("");
  const [tableName, setTableName] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [sessionId] = useState(() => crypto.randomUUID());

  const tr          = t[lang];
  const currentStep = STEPS.indexOf(screen);

  const goBack = () => {
    if (screen === "table")   setScreen("date");
    if (screen === "details") setScreen("table");
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(155deg, #071a0e 0%, #0D472B 45%, #0a3020 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        /* dot grid texture */
        .bk-bg::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        /* glow orbs */
        .bk-orb1 {
          position: fixed; top: -180px; left: -140px;
          width: 480px; height: 480px; border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, rgba(52,211,153,0.12) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
          animation: orbf1 14s ease-in-out infinite;
        }
        .bk-orb2 {
          position: fixed; bottom: -160px; right: -120px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle at 55% 55%, rgba(13,71,43,0.25) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
          animation: orbf2 17s ease-in-out infinite;
        }
        @keyframes orbf1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-24px)} }
        @keyframes orbf2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,20px)} }

        .bk-shell {
          position: relative; z-index: 1;
          min-height: 100dvh;
          display: flex; flex-direction: column; align-items: center;
          padding: 0 16px 48px;
          overflow-y: auto; overflow-x: hidden; scrollbar-width: none;
        }
        .bk-shell::-webkit-scrollbar { display: none; }
        .bk-content {
          width: 100%; max-width: 500px;
          display: flex; flex-direction: column; align-items: center;
        }

        @media (min-width: 640px) {
          .bk-shell { padding: 32px 24px 56px; }
        }
      `}</style>

      <div className="bk-bg" />
      <div className="bk-orb1" />
      <div className="bk-orb2" />

      <div className="bk-shell">
        <div className="bk-content">

          {/* ── HEADER ─────────────────────────────────────────────── */}
          <div style={{ width: "100%", paddingTop: "36px", paddingBottom: "8px", textAlign: "center" }}>
            {demoMode && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)",
                borderRadius: "100px", padding: "4px 12px", marginBottom: "10px",
              }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FCD34D", boxShadow: "0 0 6px rgba(252,211,77,0.6)" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", fontWeight: 700, color: "rgba(252,211,77,0.80)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Demo mode — no reservation saved
                </span>
              </div>
            )}
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "26px",
              letterSpacing: "0.06em",
              color: "#fff",
              margin: 0,
            }}>
              {restaurantName}
            </h1>

            {/* Lang toggle */}
            <div style={{
              marginTop: "12px",
              display: "inline-flex",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "100px",
              padding: "3px",
              gap: "2px",
            }}>
              {(["DE", "EN"] as Lang[]).map(l => {
                const active = lang === l;
                return (
                  <button key={l} onClick={() => setLang(l)} style={{
                    padding: "6px 18px", borderRadius: "100px",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "11px",
                    fontWeight: active ? 700 : 500,
                    letterSpacing: "0.06em",
                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.35)",
                    border: active ? "1px solid rgba(255,255,255,0.20)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all .18s ease",
                  }}>
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── STEP BAR ───────────────────────────────────────────── */}
          <div style={{ width: "100%", padding: "14px 0 10px" }}>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "18px",
              padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {currentStep > 0 && (
                  <button onClick={goBack} style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}>
                    <ChevronLeft size={15} color="#fff" strokeWidth={2.5} />
                  </button>
                )}
                <div>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "10px", color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
                  }}>
                    {tr.step} {currentStep + 1} {tr.of} 3
                  </p>
                  <p style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "17px", color: "#fff",
                    letterSpacing: "-0.01em", margin: "2px 0 0",
                  }}>
                    {tr.stepLabels[currentStep]}
                  </p>
                </div>
              </div>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: i === currentStep ? "22px" : "6px",
                    height: "6px",
                    borderRadius: "100px",
                    background: i <= currentStep
                      ? "linear-gradient(90deg, #34D399, #059669)"
                      : "rgba(255,255,255,0.12)",
                    transition: "width .3s ease",
                    boxShadow: i === currentStep ? "0 0 8px rgba(52,211,153,0.5)" : "none",
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* ── SCREEN CONTENT ─────────────────────────────────────── */}
          <div style={{ width: "100%", flex: 1 }}>
            {screen === "date" && (
              <Screen1
                lang={lang}
                closedDays={closedDays}
                advanceBookingDays={advanceBookingDays}
                openingHoursMap={openingHoursMap}
                partySize={partySize}
                onPartySizeChange={setPartySize}
                maxPartySize={maxPartySize}
                onNext={(d, from, till, raw) => {
                  setDateStr(d);
                  setRawDate(raw);
                  setTimeStr(till ? `${from} – ${till}` : from);
                  setScreen("table");
                }}
              />
            )}
            {screen === "table" && (
              <Screen2
                lang={lang}
                dateStr={dateStr}
                rawDate={rawDate}
                timeStr={timeStr}
                restaurantId={restaurantId}
                partySize={partySize}
                demoMode={demoMode}
                onBack={() => setScreen("date")}
                onNext={(tid, tname) => {
                  setTableId(tid);
                  setTableName(tname);
                  setScreen("details");
                }}
              />
            )}
            {screen === "details" && (
              <Screen3
                lang={lang}
                dateStr={dateStr}
                rawDate={rawDate}
                timeStr={timeStr}
                tableId={tableId}
                tableName={tableName}
                seats={partySize}
                restaurantId={restaurantId}
                restaurantSlug={restaurantSlug}
                sessionId={sessionId}
                demoMode={demoMode}
                durationMinutes={defaultDuration}
                onBack={() => setScreen("table")}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
