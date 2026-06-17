'use client';

import { useState } from "react";
import { Info, User, Phone, Mail, CreditCard, MessageSquare, ChevronDown, Send } from "lucide-react";
import { type Lang, t } from "./translations";
import { SuccessOverlay } from "./SuccessOverlay";
import { createClient } from "@/lib/supabase/client";

interface Props {
  lang: Lang;
  dateStr: string;
  rawDate: string;
  timeStr: string;
  tableId: string;      // UUID from DB (was number before)
  tableName: string;    // e.g. "T1" — for display only
  seats: number;
  restaurantId: string;
  onBack: () => void;
}

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.25)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1.5px solid rgba(255,255,255,0.50)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7) inset",
  borderRadius: "28px",
};

const FIELD: React.CSSProperties = {
  background: "rgba(255,255,255,0.25)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1.5px solid rgba(255,255,255,0.50)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7) inset",
  borderRadius: "18px",
  padding: "15px 18px",
  display: "flex",
  alignItems: "center",
  gap: "13px",
  width: "100%",
  position: "relative" as const,
  overflow: "hidden" as const,
};

const INPUT: React.CSSProperties = {
  background: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "14px",
  color: "#1C231F",
  width: "100%",
};

const FieldGlare = () => (
  <div style={{
    position: "absolute", top: 0, left: 0, right: 0, height: "40%",
    background: "linear-gradient(180deg,rgba(255,255,255,0.32) 0%,rgba(255,255,255,0) 100%)",
    pointerEvents: "none", borderRadius: "18px 18px 0 0",
  }} />
);

function generateRef() {
  return `LW-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function parseTimeFrom(timeStr: string): string {
  return timeStr.split("–")[0].trim().slice(0, 5);
}

export function Screen3({ lang, dateStr, rawDate, timeStr, tableId, tableName, seats, restaurantId, onBack }: Props) {
  const tr = t[lang];
  const supabase = createClient();

  const [name,        setName]        = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");
  const [pay,         setPay]         = useState(tr.paymentOptions[0]);
  const [notes,       setNotes]       = useState("");
  const [drop,        setDrop]        = useState(false);
  const [sending,     setSending]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || sending || success) return;
    setSending(true);
    setSubmitError(null);

    const { error } = await supabase.from("reservations").insert({
      restaurant_id:    restaurantId,
      table_id:         tableId,           // ← UUID, properly linked to restaurant_tables
      guest_name:       name.trim(),
      guest_email:      email.trim(),
      guest_phone:      phone.trim(),
      party_size:       seats,
      reservation_date: rawDate,
      reservation_time: parseTimeFrom(timeStr),
      notes:            notes.trim() || null,
      menu_preference:  pay,
      status:           "pending",         // staff must confirm → triggers table assignment
      reference_code:   generateRef(),
      duration_minutes: 90,
    });

    setSending(false);

    if (error) {
      console.error(error);
      setSubmitError(lang === "DE"
        ? "Etwas ist schiefgelaufen. Bitte versuche es erneut."
        : "Something went wrong. Please try again.");
      return;
    }

    // Hold will expire naturally — reservation is now pending and table_id is set.
    // Staff confirmation via PATCH /api/reservations/[id] will set status=confirmed.
    setSuccess(true);
  };

  return (
    <>
    {success && (
      <SuccessOverlay
        dateStr={dateStr}
        timeStr={timeStr}
        tableId={tableName}   // display the name (e.g. "T1"), not the UUID
        seats={seats}
        lang={lang}
      />
    )}
    <div style={{ display:"flex", flexDirection:"column", gap:"14px", paddingBottom:"24px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      {/* Pending banner */}
      <div style={{ ...GLASS, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"44px", background:"linear-gradient(180deg,rgba(255,255,255,0.32) 0%,rgba(255,255,255,0) 100%)", pointerEvents:"none", borderRadius:"28px 28px 0 0" }}/>
        <div style={{ display:"flex", gap:"12px" }}>
          <div style={{ width:"36px", height:"36px", borderRadius:"50%", flexShrink:0, background:"rgba(13,71,43,0.08)", border:"1px solid rgba(13,71,43,0.18)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(13,71,43,0.07), 0 1px 0 rgba(255,255,255,0.9) inset" }}>
            <Info size={15} color="#0D472B" strokeWidth={2.2}/>
          </div>
          <div>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"14px", fontWeight:700, color:"#1C231F", marginBottom:"5px" }}>
              {tr.pendingTitle}
            </p>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#6A7A76", lineHeight:1.6, margin:0 }}>
              {tr.pendingSubtitle}
            </p>
          </div>
        </div>
        <div style={{ marginTop:"14px", paddingTop:"14px", borderTop:"1px solid rgba(0,0,0,0.055)", display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr" }}>
          {[
            { label: tr.date,    value: dateStr    },
            { label: tr.time,    value: parseTimeFrom(timeStr) },
            { label: tr.table,   value: tableName  },   // show "T1" not UUID
            { label: tr.persons, value: `${seats}` },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9.5px", color:"#9AABA6", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"3px" }}>
                {item.label}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"13px", color:"#1C231F", fontWeight:700 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Name */}
      <div style={FIELD}>
        <FieldGlare/>
        <User size={16} color="#0D472B" strokeWidth={2} style={{flexShrink:0,position:"relative"}}/>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder={tr.name} style={INPUT}/>
      </div>

      {/* Phone */}
      <div style={FIELD}>
        <FieldGlare/>
        <Phone size={16} color="#0D472B" strokeWidth={2} style={{flexShrink:0,position:"relative"}}/>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={tr.phone} type="tel" style={INPUT}/>
      </div>

      {/* Email */}
      <div style={FIELD}>
        <FieldGlare/>
        <Mail size={16} color="#0D472B" strokeWidth={2} style={{flexShrink:0,position:"relative"}}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder={tr.email} type="email" style={INPUT}/>
      </div>

      {/* Payment dropdown */}
      <div style={{ position:"relative" }}>
        <button onClick={()=>setDrop(v=>!v)} style={{...FIELD, cursor:"pointer", justifyContent:"flex-start"}}>
          <FieldGlare/>
          <CreditCard size={16} color="#0D472B" strokeWidth={2} style={{flexShrink:0,position:"relative"}}/>
          <span style={{...INPUT, width:"auto", flex:1, textAlign:"left", cursor:"pointer"}}>{pay}</span>
          <ChevronDown size={15} color="#8A9A96" style={{transform:drop?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",position:"relative"}}/>
        </button>
        {drop && (
          <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:30, overflow:"hidden", background:"rgba(255,255,255,0.55)", backdropFilter:"blur(32px) saturate(180%)", WebkitBackdropFilter:"blur(32px) saturate(180%)", border:"1px solid rgba(255,255,255,0.8)", borderRadius:"18px", boxShadow:"0 20px 50px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,1) inset" }}>
            {tr.paymentOptions.map((opt,i)=>(
              <button key={opt} onClick={()=>{setPay(opt);setDrop(false);}} style={{ display:"block", width:"100%", padding:"14px 18px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:"14px", color:opt===pay?"#00C860":"#1C231F", fontWeight:opt===pay?700:400, background:"transparent", border:"none", borderBottom:i<tr.paymentOptions.length-1?"1px solid rgba(0,0,0,0.05)":"none", cursor:"pointer" }}>
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{...FIELD, alignItems:"flex-start", padding:"15px 18px"}}>
        <FieldGlare/>
        <MessageSquare size={16} color="#0D472B" strokeWidth={2} style={{marginTop:"2px",flexShrink:0,position:"relative"}}/>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder={tr.notes} rows={3} style={{...INPUT, resize:"none", lineHeight:1.6}}/>
      </div>

      {submitError && (
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"13px", color:"#C0392B", textAlign:"center", margin:0 }}>
          {submitError}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || sending || success}
        style={{
          width:"100%", padding:"18px",
          borderRadius: sending ? "50px" : "20px",
          background: !canSubmit ? "rgba(255,255,255,0.18)" : sending ? "linear-gradient(135deg,#0B3D24,#092E1B)" : "linear-gradient(135deg,#0D472B 0%,#0B3D24 100%)",
          backdropFilter: !canSubmit ? "blur(20px)" : "none",
          WebkitBackdropFilter: !canSubmit ? "blur(20px)" : "none",
          border: !canSubmit ? "1.5px solid rgba(255,255,255,0.38)" : "1.5px solid #0D472B",
          color: !canSubmit ? "rgba(28,35,31,0.35)" : "#fff",
          fontFamily:"'DM Sans',sans-serif", fontSize:"15px", fontWeight:700,
          cursor: !canSubmit || sending ? "not-allowed" : "pointer",
          boxShadow: !canSubmit ? "none" : sending ? "0 6px 20px rgba(13,71,43,0.22)" : "0 12px 36px rgba(13,71,43,0.28), 0 2px 0 rgba(255,255,255,0.25) inset",
          display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
          letterSpacing:"0.02em", marginTop:"4px",
          transition:"all 0.3s cubic-bezier(.4,0,.2,1)",
          overflow:"hidden", position:"relative",
        }}>
        {!sending && (
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)", backgroundSize:"200% 100%", animation:"shimmer 2.4s ease-in-out infinite", pointerEvents:"none" }}/>
        )}
        {sending ? (
          <div style={{ width:"22px", height:"22px", borderRadius:"50%", border:"2.5px solid rgba(255,255,255,0.35)", borderTopColor:"#fff", animation:"spin 0.75s linear infinite" }}/>
        ) : (
          <>
            <Send size={15} color={canSubmit ? "#fff" : "rgba(28,35,31,0.35)"} strokeWidth={2.5}/>
            {tr.submit}
          </>
        )}
      </button>
    </div>
    </>
  );
}