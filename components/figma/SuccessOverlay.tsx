import { useEffect, useRef, useState } from "react";

interface Props {
  dateStr: string;
  timeStr: string;
  tableId: string;
  seats: number;
  lang: "DE" | "EN";
}

const CONFETTI_COLORS = [
  "#0D472B", "#0B3D24", "#1A6B3E", "#2D8A55",
  "#FFFFFF", "#C8DDD3", "#4A9B6F", "#E8F2EC",
];

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotV: number;
  color: string;
  size: number;
  shape: "rect" | "circle" | "line";
  opacity: number;
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 40,
    vx: (Math.random() - 0.5) * 14,
    vy: -(Math.random() * 10 + 6),
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 14,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 7 + 4,
    shape: (["rect", "circle", "line"] as const)[Math.floor(Math.random() * 3)],
    opacity: 1,
  }));
}

export function SuccessOverlay({ dateStr, timeStr, tableId, seats, lang }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [checkPhase, setCheckPhase] = useState<"hidden" | "drawing" | "done">("hidden");
  const [cardVisible, setCardVisible] = useState(false);
  const [ringScale, setRingScale] = useState(0);
  const [pulseRing, setPulseRing] = useState(false);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    // Stagger: ring burst → particles → card → check
    const t1 = setTimeout(() => setRingScale(1), 50);
    const t2 = setTimeout(() => {
      setParticles(makeParticles(52));
    }, 200);
    const t3 = setTimeout(() => setCardVisible(true), 420);
    const t4 = setTimeout(() => setCheckPhase("drawing"), 700);
    const t5 = setTimeout(() => { setCheckPhase("done"); setPulseRing(true); }, 1200);

    return () => { [t1,t2,t3,t4,t5].forEach(clearTimeout); };
  }, []);

  // Animate confetti
  useEffect(() => {
    if (particles.length === 0) return;
    const animate = () => {
      frameRef.current++;
      setParticles(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + p.vx * 0.55,
          y: p.y + p.vy * 0.55,
          vy: p.vy + 0.38,
          vx: p.vx * 0.985,
          rot: p.rot + p.rotV,
          opacity: p.y > 110 ? Math.max(0, p.opacity - 0.045) : p.opacity,
        })).filter(p => p.opacity > 0.01);
        return next;
      });
      if (frameRef.current < 180) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [particles.length]);

  const isDE = lang === "DE";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(145deg, rgba(184,240,212,0.94) 0%, rgba(141,232,188,0.96) 40%, rgba(194,245,224,0.95) 100%)",
      backdropFilter: "blur(32px)",
      WebkitBackdropFilter: "blur(32px)",
      animation: "fadeInBg .35s ease",
    }}>
      <style>{`
        @keyframes fadeInBg { from { opacity:0 } to { opacity:1 } }
        @keyframes checkDraw {
          from { stroke-dashoffset: 60 }
          to   { stroke-dashoffset: 0 }
        }
        @keyframes ringPop {
          0%   { transform: scale(0); opacity:1 }
          60%  { transform: scale(1.15); opacity:0.9 }
          100% { transform: scale(1); opacity:1 }
        }
        @keyframes pulseRing {
          0%,100% { box-shadow: 0 0 0 0 rgba(13,71,43,0.35) }
          50%     { box-shadow: 0 0 0 18px rgba(13,71,43,0) }
        }
        @keyframes cardSlide {
          from { opacity:0; transform: translateY(28px) scale(0.95) }
          to   { opacity:1; transform: translateY(0) scale(1) }
        }
        @keyframes floatUp {
          0%,100% { transform: translateY(0) }
          50%     { transform: translateY(-6px) }
        }
      `}</style>

      {/* Confetti canvas layer */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.shape === "line" ? `${p.size * 2.5}px` : `${p.size}px`,
            height: p.shape === "line" ? "2px" : `${p.size}px`,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "rect" ? "2px" : "1px",
            background: p.color,
            opacity: p.opacity,
            transform: `rotate(${p.rot}deg)`,
            willChange: "transform",
          }} />
        ))}
      </div>

      {/* Ripple ring */}
      <div style={{
        width: "96px", height: "96px", borderRadius: "50%",
        background: "linear-gradient(135deg,#0D472B,#0B3D24)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `scale(${ringScale})`,
        transition: "transform 0.5s cubic-bezier(.34,1.56,.64,1)",
        boxShadow: pulseRing
          ? "0 0 0 0 rgba(13,71,43,0.35)"
          : "0 16px 48px rgba(0,184,94,0.45), 0 4px 16px rgba(0,184,94,0.3)",
        animation: pulseRing ? "pulseRing 2s ease-in-out infinite" : undefined,
        flexShrink: 0,
        position: "relative",
        zIndex: 2,
      }}>
        {/* SVG checkmark */}
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path
            d="M10 22 L19 31 L34 13"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="60"
            strokeDashoffset={checkPhase === "hidden" ? 60 : 0}
            style={{
              transition: checkPhase === "drawing"
                ? "stroke-dashoffset 0.55s cubic-bezier(.4,0,.2,1)"
                : "none",
            }}
          />
        </svg>
      </div>

      {/* Confirmation card */}
      <div style={{
        marginTop: "28px",
        width: "320px",
        maxWidth: "calc(100vw - 44px)",
        background: "rgba(255,255,255,0.14)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "1.5px solid rgba(255,255,255,0.45)",
        borderRadius: "28px",
        padding: "28px 26px 24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset",
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.95)",
        transition: "opacity 0.45s cubic-bezier(.4,0,.2,1), transform 0.45s cubic-bezier(.34,1.56,.64,1)",
        position: "relative",
        overflow: "hidden",
        animation: cardVisible ? "floatUp 4s ease-in-out 1.5s infinite" : undefined,
        zIndex: 2,
      }}>
        {/* Top glare */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:"44px",
          background:"linear-gradient(180deg,rgba(255,255,255,0.38) 0%,rgba(255,255,255,0) 100%)",
          borderRadius:"28px 28px 0 0", pointerEvents:"none",
        }}/>

        <div style={{ textAlign:"center", marginBottom:"20px" }}>
          <p style={{
            fontFamily:"'DM Serif Display',serif",
            fontSize:"22px", color:"#1A1A1A", letterSpacing:"-0.02em",
            margin:"0 0 6px",
          }}>
            {isDE ? "Anfrage gesendet" : "Reservation Request Sent"}
          </p>
          <p style={{
            fontFamily:"'DM Sans',sans-serif",
            fontSize:"13px", color:"#6A7A76", margin:0, lineHeight:1.5,
          }}>
            {isDE
              ? "Wir melden uns in Kürze zur Bestätigung."
              : "We'll be in touch shortly to confirm."}
          </p>
        </div>

        {/* Details grid */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:"12px",
          padding:"16px",
          background:"rgba(13,71,43,0.07)",
          border:"1px solid rgba(13,71,43,0.18)",
          borderRadius:"18px",
        }}>
          {[
            { label: isDE ? "Datum" : "Date",    value: dateStr,             icon: "📅" },
            { label: isDE ? "Uhrzeit" : "Time",  value: timeStr,             icon: "🕐" },
            { label: isDE ? "Tisch" : "Table",   value: `0${tableId}`,       icon: "🪑" },
            { label: isDE ? "Personen" : "Guests", value: `${seats}`,        icon: "👥" },
          ].map(item => (
            <div key={item.label} style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#9AABA6", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                {item.label}
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"13px", color:"#1A1A1A", fontWeight:700 }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Confirmation number */}
        <div style={{
          marginTop:"16px",
          padding:"10px 16px",
          background:"rgba(255,255,255,0.35)",
          border:"1.5px solid rgba(255,255,255,0.5)",
          borderRadius:"14px",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
        }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#9AABA6", textTransform:"uppercase", letterSpacing:"0.07em" }}>
            {isDE ? "Buchungsnr." : "Booking ref."}
          </span>
          <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:"15px", color:"#0D472B", letterSpacing:"0.08em" }}>
            #LW-{Math.floor(Math.random() * 9000 + 1000)}
          </span>
        </div>

        {/* Confirmation ping */}
        <div style={{ marginTop:"16px", display:"flex", alignItems:"center", gap:"8px", justifyContent:"center" }}>
          <div style={{
            width:"7px", height:"7px", borderRadius:"50%",
            background:"#0D472B",
            boxShadow:"0 0 10px rgba(13,71,43,0.7)",
            animation:"pulseRing 1.6s ease-in-out infinite",
          }}/>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#6A7A76" }}>
            {isDE ? "Bestätigungs-E-Mail wird gesendet" : "Confirmation email on its way"}
          </span>
        </div>
      </div>
    </div>
  );
}
