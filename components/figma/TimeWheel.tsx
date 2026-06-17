import { useRef, useEffect, useState, useCallback } from "react";

const ITEM_H = 48;
const VISIBLE = 5;
const NICHT_SICHER = "__NICHT_SICHER__";

interface TimeWheelProps {
  times: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
  optional?: boolean;
  disabled?: boolean;
  nichtSicher?: boolean;
  nichtSicherLabel?: string; // translated label for the "not sure" option
  lockedBefore?: string; // times strictly before this are locked
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function TimeWheel({ times, value, onChange, label, optional, disabled, nichtSicher, nichtSicherLabel = "Nicht sicher", lockedBefore }: TimeWheelProps) {
  const ref     = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  // Build the internal list: optionally prepend the "Nicht sicher" sentinel
  const internalTimes = nichtSicher ? [NICHT_SICHER, ...times] : times;

  const valueToIdx = useCallback((v: string | null): number => {
    if (nichtSicher && v === null) return 0;
    if (v === null) return 0;
    const idx = internalTimes.indexOf(v);
    return idx >= 0 ? idx : 0;
  }, [internalTimes, nichtSicher]);

  const [activeIdx, setActiveIdx] = useState(() => valueToIdx(value));

  const scrollTo = useCallback((idx: number, smooth = false) => {
    if (!ref.current) return;
    ref.current.scrollTo({ top: idx * ITEM_H, behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { scrollTo(activeIdx, false); }, []); // eslint-disable-line

  // Sync when external value changes
  useEffect(() => {
    const idx = valueToIdx(value);
    if (idx !== activeIdx) {
      setActiveIdx(idx);
      scrollTo(idx, true);
    }
  }, [value]); // eslint-disable-line

  const isLocked = (slot: string) => {
    if (slot === NICHT_SICHER || !lockedBefore) return false;
    return timeToMinutes(slot) < timeToMinutes(lockedBefore);
  };

  const snap = (rawIdx: number) => {
    const clamped = Math.max(0, Math.min(rawIdx, internalTimes.length - 1));
    setActiveIdx(clamped);
    const slot = internalTimes[clamped];
    onChange(slot === NICHT_SICHER ? null : slot);
    return clamped;
  };

  const handleScroll = () => {
    if (!ref.current || ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      if (!ref.current) { ticking.current = false; return; }
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      snap(idx);
      ticking.current = false;
    });
  };

  const snapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleScrollEnd = () => {
    if (snapTimeout.current) clearTimeout(snapTimeout.current);
    snapTimeout.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const finalIdx = snap(idx);
      scrollTo(finalIdx, true);
    }, 80);
  };

  const pad = Math.floor(VISIBLE / 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, opacity: disabled ? 0.4 : 1, transition: "opacity .3s" }}>
      {/* Column label */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "10px",
        fontWeight: 700,
        color: optional ? "#9AABA6" : "#0D472B",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}>
        {label}
        {optional && (
          <span style={{
            fontSize: "8px",
            color: "#9AABA6",
            background: "rgba(154,171,166,0.15)",
            border: "1px dashed rgba(154,171,166,0.5)",
            borderRadius: "4px",
            padding: "1px 5px",
            letterSpacing: "0.05em",
          }}>
            opt.
          </span>
        )}
      </div>

      {/* Wheel wrapper */}
      <div style={{
        position: "relative",
        width: "100%",
        height: `${ITEM_H * VISIBLE}px`,
        borderRadius: "18px",
        overflow: "hidden",
        border: optional
          ? "1.5px dashed rgba(255,255,255,0.45)"
          : "1.5px solid rgba(255,255,255,0.50)",
        background: optional
          ? "rgba(255,255,255,0.18)"
          : "rgba(255,255,255,0.25)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        boxShadow: optional
          ? "0 4px 16px rgba(0,0,0,0.04)"
          : "0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7) inset",
      }}>

        {/* Selection highlight band */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "8px",
          right: "8px",
          height: `${ITEM_H}px`,
          transform: "translateY(-50%)",
          background: optional
            ? "rgba(154,171,166,0.1)"
            : "linear-gradient(135deg, rgba(13,71,43,0.10) 0%, rgba(11,61,36,0.06) 100%)",
          borderRadius: "12px",
          border: optional
            ? "1px dashed rgba(154,171,166,0.35)"
            : "1px solid rgba(13,71,43,0.18)",
          pointerEvents: "none",
          zIndex: 2,
        }}/>

        {/* Top fade */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: `${ITEM_H * 2}px`,
          background: "linear-gradient(to bottom, rgba(180,240,210,0.55) 0%, rgba(180,240,210,0) 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}/>
        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${ITEM_H * 2}px`,
          background: "linear-gradient(to top, rgba(180,240,210,0.55) 0%, rgba(180,240,210,0) 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}/>

        {/* Scrollable drum */}
        <div
          ref={ref}
          onScroll={() => { handleScroll(); handleScrollEnd(); }}
          style={{
            height: "100%",
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            cursor: disabled ? "not-allowed" : "ns-resize",
          } as React.CSSProperties}
        >
          {Array.from({ length: pad }).map((_, i) => (
            <div key={`pt${i}`} style={{ height: ITEM_H, scrollSnapAlign: "center", flexShrink: 0 }} />
          ))}

          {internalTimes.map((slot, idx) => {
            const isNS   = slot === NICHT_SICHER;
            const locked = isLocked(slot);
            const isSel  = idx === activeIdx;
            const dist   = Math.abs(idx - activeIdx);
            const scale  = isSel ? 1 : dist === 1 ? 0.88 : 0.76;
            const baseOpac = isSel ? 1 : dist === 1 ? 0.55 : 0.28;
            const opac   = locked ? Math.min(baseOpac, 0.22) : baseOpac;

            if (isNS) {
              // "Nicht sicher" glass capsule row
              return (
                <div
                  key={NICHT_SICHER}
                  style={{
                    height: ITEM_H,
                    scrollSnapAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    cursor: "pointer",
                    opacity: isSel ? 1 : dist === 1 ? 0.6 : 0.3,
                    transform: `scale(${scale})`,
                    transition: "opacity .15s ease, transform .15s ease",
                    userSelect: "none",
                  }}
                  onClick={() => { setActiveIdx(0); scrollTo(0, true); onChange(null); }}
                >
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 13px",
                    borderRadius: "100px",
                    background: isSel
                      ? "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.42) 100%)"
                      : "rgba(255,255,255,0.25)",
                    border: isSel
                      ? "1px solid rgba(255,255,255,0.9)"
                      : "1px dashed rgba(154,171,166,0.45)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: isSel
                      ? "0 4px 16px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,1) inset"
                      : "none",
                  }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: isSel ? "11px" : "10px",
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? "#1C231F" : "#9AABA6",
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                    }}>
                      {nichtSicherLabel}
                    </span>
                    {isSel && (
                      <span style={{
                        fontSize: "8px",
                        color: "#9AABA6",
                        background: "rgba(154,171,166,0.15)",
                        border: "1px dashed rgba(154,171,166,0.5)",
                        borderRadius: "4px",
                        padding: "1px 4px",
                        letterSpacing: "0.04em",
                      }}>opt.</span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={slot}
                style={{
                  height: ITEM_H,
                  scrollSnapAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: isSel ? "22px" : "18px",
                  fontWeight: isSel ? 700 : 400,
                  color: locked ? "#B0C0BC" : isSel ? (optional ? "#3A4440" : "#1C231F") : "#3A4440",
                  opacity: opac,
                  transform: `scale(${scale})`,
                  transition: "opacity .15s ease, transform .15s ease, font-size .15s ease",
                  userSelect: "none",
                  letterSpacing: "-0.02em",
                  cursor: locked ? "not-allowed" : disabled ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  textDecoration: locked ? "line-through rgba(154,171,166,0.5) 1.5px" : "none",
                }}
                onClick={() => {
                  if (locked || disabled) return;
                  setActiveIdx(idx);
                  scrollTo(idx, true);
                  onChange(slot);
                }}
              >
                {slot}
              </div>
            );
          })}

          {Array.from({ length: pad }).map((_, i) => (
            <div key={`pb${i}`} style={{ height: ITEM_H, scrollSnapAlign: "center", flexShrink: 0 }} />
          ))}
        </div>
      </div>

    </div>
  );
}
