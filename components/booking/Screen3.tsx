'use client';

import { useState } from "react";
import { User, Phone, Mail, MessageSquare, Send, Calendar, Clock, Users, Armchair } from "lucide-react";
import { type Lang, t } from "./translations";
import { SuccessOverlay } from "./SuccessOverlay";

interface Props {
  lang: Lang;
  dateStr: string;
  rawDate: string;
  timeStr: string;
  tableId: string;
  tableName: string;
  seats: number;
  restaurantId: string;
  restaurantSlug: string;
  sessionId: string;
  demoMode?: boolean;
  onBack: () => void;
}

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(40px) saturate(160%)",
  WebkitBackdropFilter: "blur(40px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "22px",
};

const FIELD_WRAP: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "14px",
  padding: "13px 16px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  transition: "border-color .15s",
};

const INPUT: React.CSSProperties = {
  background: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "14px",
  color: "#fff",
  width: "100%",
};

function parseTimeFrom(timeStr: string): string {
  return timeStr.split("–")[0].trim().slice(0, 5);
}

export function Screen3({
  lang, dateStr, rawDate, timeStr, tableId, tableName,
  seats, restaurantSlug, sessionId, demoMode = false,
}: Props) {
  const tr = t[lang];

  const [name,        setName]        = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");
  const [notes,       setNotes]       = useState("");
  const [consented,   setConsented]   = useState(false);
  const [sending,     setSending]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0
    && email.trim().length > 0 && consented;

  const handleSubmit = async () => {
    if (!canSubmit || sending || success) return;
    setSending(true);
    setSubmitError(null);

    if (demoMode) {
      await new Promise(r => setTimeout(r, 700));
      setSending(false);
      setSuccess(true);
      return;
    }

    try {
      const res = await fetch(`/api/book/${restaurantSlug}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name:       name.trim(),
          guest_email:      email.trim(),
          guest_phone:      phone.trim() || null,
          party_size:       seats,
          reservation_date: rawDate,
          reservation_time: parseTimeFrom(timeStr),
          table_id:         tableId || null,
          notes:            notes.trim() || null,
          duration_minutes: 90,
          guest_consented:  true,
          session_id:       sessionId,
        }),
      });

      const data = await res.json();
      setSending(false);

      if (!res.ok) {
        setSubmitError(data.error ?? (lang === "DE"
          ? "Etwas ist schiefgelaufen. Bitte versuche es erneut."
          : "Something went wrong. Please try again."));
        return;
      }
    } catch {
      setSending(false);
      setSubmitError(lang === "DE"
        ? "Netzwerkfehler. Bitte versuche es erneut."
        : "Network error. Please try again.");
      return;
    }

    setSuccess(true);
  };

  return (
    <>
      {success && (
        <SuccessOverlay
          dateStr={dateStr}
          timeStr={timeStr}
          tableId={tableName}
          seats={seats}
          lang={lang}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "24px" }}>
        <style>{`
          @keyframes spin3 { to { transform: rotate(360deg) } }
          @keyframes shimmer3 { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          .bk-field:focus-within { border-color: rgba(52,211,153,0.35) !important; }
          ::placeholder { color: rgba(255,255,255,0.28) !important; }
        `}</style>

        {/* Booking summary */}
        <div style={{ ...CARD, padding: "18px 20px" }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "10px", fontWeight: 700,
            color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px",
          }}>
            {lang === "DE" ? "Deine Reservierung" : "Your reservation"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { icon: Calendar, label: tr.date,    value: dateStr },
              { icon: Clock,    label: tr.time,    value: parseTimeFrom(timeStr) },
              { icon: Armchair, label: tr.table,   value: tableName },
              { icon: Users,    label: tr.persons, value: `${seats}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px", padding: "10px 12px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <Icon size={13} color="rgba(52,211,153,0.70)" strokeWidth={2} />
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#fff", fontWeight: 700, margin: "2px 0 0" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "12px", padding: "10px 12px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)", borderRadius: "10px" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.50)", margin: 0, lineHeight: 1.5 }}>
              {tr.pendingSubtitle}
            </p>
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="bk-field" style={{ ...FIELD_WRAP }}>
            <User size={15} color="rgba(52,211,153,0.70)" strokeWidth={2} style={{ flexShrink: 0 }} />
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder={tr.name} style={INPUT} autoComplete="name" />
          </div>
          <div className="bk-field" style={{ ...FIELD_WRAP }}>
            <Phone size={15} color="rgba(52,211,153,0.70)" strokeWidth={2} style={{ flexShrink: 0 }} />
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder={tr.phone} type="tel" style={INPUT} autoComplete="tel" />
          </div>
          <div className="bk-field" style={{ ...FIELD_WRAP }}>
            <Mail size={15} color="rgba(52,211,153,0.70)" strokeWidth={2} style={{ flexShrink: 0 }} />
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder={tr.email} type="email" style={INPUT} autoComplete="email" />
          </div>
          <div className="bk-field" style={{ ...FIELD_WRAP, alignItems: "flex-start", padding: "13px 16px" }}>
            <MessageSquare size={15} color="rgba(52,211,153,0.70)" strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px" }} />
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={tr.notes} rows={3}
              style={{ ...INPUT, resize: "none", lineHeight: 1.6 }} />
          </div>
        </div>

        {/* GDPR Consent */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "14px", padding: "14px 16px",
          display: "flex", alignItems: "flex-start", gap: "12px",
        }}>
          <input
            type="checkbox" id="guest-consent" checked={consented}
            onChange={e => setConsented(e.target.checked)}
            style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#34D399", flexShrink: 0, cursor: "pointer" }}
          />
          <label htmlFor="guest-consent" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "12px",
            color: "rgba(255,255,255,0.45)", lineHeight: 1.6, cursor: "pointer",
          }}>
            {lang === "DE"
              ? "Ich stimme zu, dass meine persönlichen Daten zum Zweck der Reservierungsabwicklung gespeichert werden (DSGVO Art. 6)."
              : "I consent to my personal data being stored for reservation purposes in accordance with GDPR Art. 6."}
            {" "}
            <a href="/privacy" target="_blank" style={{ color: "rgba(52,211,153,0.70)", textDecoration: "none" }}>
              {lang === "DE" ? "Datenschutz" : "Privacy policy"}
            </a>
          </label>
        </div>

        {submitError && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: "12px", padding: "12px 16px" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#fca5a5", margin: 0 }}>{submitError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || sending || success}
          style={{
            width: "100%", padding: "17px",
            borderRadius: "18px", marginTop: "4px",
            background: !canSubmit
              ? "rgba(255,255,255,0.05)"
              : sending
              ? "linear-gradient(135deg, #0D472B, #092318)"
              : "linear-gradient(135deg, #34D399 0%, #059669 100%)",
            border: !canSubmit ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(52,211,153,0.50)",
            color: !canSubmit ? "rgba(255,255,255,0.20)" : sending ? "#fff" : "#022c22",
            fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 800,
            cursor: !canSubmit || sending ? "not-allowed" : "pointer",
            boxShadow: !canSubmit ? "none" : "0 8px 28px rgba(52,211,153,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            letterSpacing: "0.01em",
            transition: "all .2s cubic-bezier(.4,0,.2,1)",
            position: "relative", overflow: "hidden",
          }}>
          {canSubmit && !sending && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmer3 2.5s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          )}
          {sending ? (
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", animation: "spin3 .7s linear infinite" }} />
          ) : (
            <>
              <Send size={15} strokeWidth={2.5} />
              {tr.submit}
            </>
          )}
        </button>
      </div>
    </>
  );
}
