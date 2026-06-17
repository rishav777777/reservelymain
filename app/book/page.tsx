'use client';

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Screen1 } from "@/components/figma/Screen1";
import { Screen2 } from "@/components/figma/Screen2";
import { Screen3 } from "@/components/figma/Screen3";
import { type Lang, t } from "@/components/figma/translations";
import { createClient } from "@/lib/supabase/client";

type Screen = "date" | "table" | "details";
const STEPS: Screen[] = ["date", "table", "details"];

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.25)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1.5px solid rgba(255,255,255,0.50)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7) inset",
};

export default function BookPage() {
  const [screen,       setScreen]       = useState<Screen>("date");
  const [lang,         setLang]         = useState<Lang>("EN");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [dateStr,      setDateStr]      = useState("");
  const [rawDate,      setRawDate]      = useState("");
  const [timeStr,      setTimeStr]      = useState("");
  const [tableId,      setTableId]      = useState("");     // UUID
  const [tableName,    setTableName]    = useState("");     // e.g. "T1"
  const [seats,        setSeats]        = useState(4);

  // Fetch restaurantId on mount (needed by Screen2 and Screen3)
  useEffect(() => {
  async function load() {
    const supabase = createClient();
    // Try authenticated user first (staff previewing)
    const { data: profile } = await supabase
      .from("profiles")
      .select("restaurant_id")
      .maybeSingle();
    if (profile?.restaurant_id) {
      setRestaurantId(profile.restaurant_id);
      return;
    }
    // Fallback: fetch the single restaurant (public booking page)
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (restaurant?.id) setRestaurantId(restaurant.id);
  }
  load();
}, []);
  const tr          = t[lang];
  const currentStep = STEPS.indexOf(screen);

  const goBack = () => {
    if (screen === "table")   setScreen("date");
    if (screen === "details") setScreen("table");
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      background: "#F4F6F4", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(16px,-20px) scale(1.03)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-12px,18px) scale(1.04)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,12px) scale(1.03)} }

        .book-shell {
          width: 100%; min-height: 100vh;
          display: flex; flex-direction: column; align-items: center;
          overflow-y: auto; overflow-x: hidden; scrollbar-width: none;
          padding: 0 16px; box-sizing: border-box; position: relative; z-index: 1;
        }
        .book-content {
          width: 100%; max-width: 520px;
          display: flex; flex-direction: column; align-items: center; flex: 1;
        }
        @media (min-width: 768px) {
          .book-shell { align-items: center; padding: 40px 24px; min-height: 100vh; }
          .book-content {
            max-width: 480px;
            background: rgba(255,255,255,0.45);
            border: 1.5px solid rgba(255,255,255,0.6);
            border-radius: 32px;
            box-shadow: 0 32px 80px rgba(0,0,0,0.10), 0 2px 0 rgba(255,255,255,0.8) inset;
            padding: 0 28px 40px; min-height: auto;
          }
        }
        @media (max-width: 767px) {
          .book-shell { padding: 0 22px; }
          .book-content { max-width: 100%; }
        }
      `}</style>

      {/* Orbs */}
      <div style={{ position:"fixed", top:"-200px", left:"-180px", width:"560px", height:"560px", borderRadius:"50%", background:"radial-gradient(circle at 40% 40%, rgba(13,71,43,0.13) 0%, rgba(13,71,43,0.04) 55%, transparent 75%)", pointerEvents:"none", animation:"orbFloat1 10s ease-in-out infinite" }}/>
      <div style={{ position:"fixed", bottom:"-200px", right:"-180px", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle at 50% 50%, rgba(13,71,43,0.11) 0%, rgba(13,71,43,0.03) 55%, transparent 75%)", pointerEvents:"none", animation:"orbFloat2 13s ease-in-out infinite" }}/>
      <div style={{ position:"fixed", top:"-40px", right:"-60px", width:"320px", height:"320px", borderRadius:"50%", background:"radial-gradient(circle at 45% 45%, rgba(255,255,255,0.55) 0%, transparent 70%)", pointerEvents:"none", animation:"orbFloat3 14s ease-in-out infinite" }}/>

      <div className="book-shell">
        <div className="book-content">

          {/* HEADER */}
          <div style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", paddingTop:"32px", paddingBottom:"4px", flexShrink:0 }}>
            <div style={{ textAlign:"center", userSelect:"none" }}>
              <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:"11px", fontWeight:700, letterSpacing:"0.2em", color:"rgba(28,35,31,0.45)", textTransform:"uppercase", lineHeight:1, marginBottom:"4px" }}>Der</div>
              <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:"34px", letterSpacing:"0.14em", textTransform:"uppercase", color:"#1C231F", lineHeight:1 }}>Ledera</div>
              <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:"9.5px", fontWeight:600, letterSpacing:"0.26em", color:"rgba(28,35,31,0.42)", textTransform:"uppercase", lineHeight:1, marginTop:"5px" }}>Wirtshaus · Heuriger</div>
            </div>

            {/* Language toggle */}
            <div style={{ marginTop:"10px", display:"inline-flex", ...GLASS, borderRadius:"100px", padding:"4px", gap:"2px", position:"relative", overflow:"hidden" }}>
              {(["DE","EN"] as Lang[]).map(l => {
                const active = lang === l;
                return (
                  <button key={l} onClick={() => setLang(l)} style={{
                    padding:"7px 20px", borderRadius:"100px",
                    fontFamily:"'DM Sans',sans-serif", fontSize:"12px", fontWeight: active ? 700 : 500,
                    background: active ? "linear-gradient(135deg,#0D472B 0%,#0B3D24 100%)" : "transparent",
                    color: active ? "#fff" : "rgba(28,35,31,0.5)",
                    border: active ? "1px solid rgba(13,71,43,0.5)" : "1px solid transparent",
                    boxShadow: active ? "0 4px 14px rgba(13,71,43,0.3), 0 1px 0 rgba(255,255,255,0.2) inset" : "none",
                    cursor:"pointer", transition:"all .2s ease", letterSpacing:"0.06em",
                  }}>
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP BAR */}
          <div style={{ width:"100%", padding:"18px 0 12px", flexShrink:0 }}>
            <div style={{ ...GLASS, borderRadius:"22px", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", position:"relative" }}>
                {currentStep > 0 && (
                  <button onClick={goBack} style={{ width:"34px", height:"34px", borderRadius:"50%", ...GLASS, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                    <ChevronLeft size={16} color="#1C231F" strokeWidth={2.2}/>
                  </button>
                )}
                <div>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"rgba(28,35,31,0.45)", textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>
                    {tr.step} {currentStep + 1} {tr.of} 3
                  </p>
                  <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"19px", color:"#1C231F", letterSpacing:"-0.02em", margin:"2px 0 0" }}>
                    {tr.stepLabels[currentStep]}
                  </p>
                </div>
              </div>
              <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: i === currentStep ? "20px" : "6px", height:"6px", borderRadius:"100px",
                    background: i <= currentStep ? "linear-gradient(90deg,#0D472B,#0B3D24)" : "rgba(13,71,43,0.18)",
                    transition:"width .3s ease",
                    boxShadow: i === currentStep ? "0 0 8px rgba(13,71,43,0.35)" : "none",
                  }}/>
                ))}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ width:"100%", flex:1, paddingBottom:"32px" }}>
            {screen === "date" && (
              <Screen1
                lang={lang}
                onNext={(d, from, till, raw) => {
                  setDateStr(d);
                  setRawDate(raw);
                  setTimeStr(till ? `${from} – ${till}` : from);
                  setScreen("table");
                }}
              />
            )}
            {screen === "table" && restaurantId && (
              <Screen2
                lang={lang}
                dateStr={dateStr}
                rawDate={rawDate}
                timeStr={timeStr}
                restaurantId={restaurantId}
                onBack={() => setScreen("date")}
                onNext={(tid, tname, s) => {
                  setTableId(tid);      // UUID
                  setTableName(tname);  // "T1"
                  setSeats(s);
                  setScreen("details");
                }}
              />
            )}
            {screen === "table" && !restaurantId && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"200px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", border:"2.5px solid rgba(13,71,43,0.15)", borderTopColor:"#0D472B", animation:"spin 0.75s linear infinite" }}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {screen === "details" && (
              <Screen3
                lang={lang}
                dateStr={dateStr}
                rawDate={rawDate}
                timeStr={timeStr}
                tableId={tableId}
                tableName={tableName}
                seats={seats}
                restaurantId={restaurantId}
                onBack={() => setScreen("table")}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}