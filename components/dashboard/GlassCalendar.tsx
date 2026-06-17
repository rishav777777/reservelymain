import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ReservationSummary {
  date: string; // "YYYY-MM-DD"
  pending: number;
  confirmed: number;
}

interface GlassCalendarProps {
  summaries: ReservationSummary[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function GlassCalendar({ summaries, selectedDate, onSelectDate }: GlassCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const summaryMap = new Map(summaries.map((s) => [s.date, s]));

  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <div className="flex flex-col h-full select-none">
      {/* Month navigator */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button
          onClick={prevMonth}
          className="flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90"
          style={{
            width: 44, height: 44,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 2px 8px rgba(28,35,31,0.08)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.85)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.55)")}
        >
          <ChevronLeft size={20} color="#1C231F" strokeWidth={2} />
        </button>

        <div className="text-center">
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "26px",
            fontWeight: 400,
            color: "#1C231F",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}>
            {MONTHS[month]}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            color: "#5a6b60",
            letterSpacing: "0.08em",
            marginTop: "3px",
          }}>
            {year}
          </p>
        </div>

        <button
          onClick={nextMonth}
          className="flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90"
          style={{
            width: 44, height: 44,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 2px 8px rgba(28,35,31,0.08)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.85)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.55)")}
        >
          <ChevronRight size={20} color="#1C231F" strokeWidth={2} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3 pb-1" style={{ gap: "4px" }}>
        {WEEKDAYS.map(d => (
          <div key={d} className="flex items-center justify-center" style={{ height: 32 }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              color: "#8fa393",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        className="grid grid-cols-7 px-3 pb-3"
        style={{ gap: "5px", alignContent: "start", flex: 1 }}
      >
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - offset + 1;
          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
          const key = isValid ? toKey(year, month, dayNum) : null;
          const summary = key ? summaryMap.get(key) : undefined;
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const hasPending = (summary?.pending ?? 0) > 0;
          const hasConfirmed = (summary?.confirmed ?? 0) > 0 && !hasPending;

          return (
            <div key={i} style={{ position: "relative" }}>
              {isValid && (
                <button
                  onClick={() => key && onSelectDate(key)}
                  className="w-full flex flex-col items-center justify-center rounded-xl transition-all duration-150 active:scale-95"
                  style={{
                    height: 60,
                    background: isSelected
                      ? "#0D472B"
                      : isToday
                      ? "rgba(27,122,67,0.12)"
                      : hasPending
                      ? "rgba(27,122,67,0.07)"
                      : "rgba(255,255,255,0.42)",
                    border: isSelected
                      ? "1px solid #0D472B"
                      : isToday
                      ? "1.5px solid rgba(27,122,67,0.4)"
                      : "1px solid rgba(255,255,255,0.78)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: isSelected
                      ? "0 4px 16px rgba(13,71,43,0.3)"
                      : "0 2px 8px rgba(28,35,31,0.06)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.72)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(28,35,31,0.1)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isToday
                        ? "rgba(27,122,67,0.12)"
                        : hasPending
                        ? "rgba(27,122,67,0.07)"
                        : "rgba(255,255,255,0.42)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(28,35,31,0.06)";
                    }
                  }}
                >
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "20px",
                    fontWeight: isToday || isSelected ? 700 : 500,
                    color: isSelected
                      ? "#ffffff"
                      : isToday
                      ? "#1B7A43"
                      : "#1C231F",
                    lineHeight: 1,
                  }}>
                    {dayNum}
                  </span>

                  {/* Small confirmed indicator dot */}
                  {hasConfirmed && !isSelected && (
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "#1B7A43",
                      marginTop: "4px",
                    }} />
                  )}
                </button>
              )}

              {/* Pending badge — large, forest green */}
              {isValid && hasPending && (
                <div
                  style={{
                    position: "absolute",
                    top: -7,
                    right: -5,
                    minWidth: 22,
                    height: 22,
                    borderRadius: "11px",
                    background: "#0D472B",
                    boxShadow: "0 2px 8px rgba(13,71,43,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                    border: "2px solid #EEF2EE",
                    padding: "0 4px",
                  }}
                >
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#ffffff",
                    lineHeight: 1,
                  }}>
                    {summary!.pending}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-5 px-5 py-4"
        style={{ borderTop: "1px solid rgba(28,35,31,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <div style={{
            width: 20, height: 20, borderRadius: "6px",
            background: "#0D472B",
          }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#5a6b60", fontWeight: 500 }}>
            Offen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{
            width: 20, height: 20, borderRadius: "6px",
            background: "#0D472B",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#5a6b60", fontWeight: 500 }}>
            Bestätigt
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{
            width: 20, height: 20, borderRadius: "6px",
            background: "#1B7A43",
          }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#5a6b60", fontWeight: 500 }}>
            Heute
          </span>
        </div>
      </div>
    </div>
  );
}
