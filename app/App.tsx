import { useState, useRef, useEffect } from "react";
import { Users, ChevronLeft, ChevronRight, Clock, ChevronDown, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { BookingData } from "@/types";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const TIME_SLOTS = [
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM","9:00 PM","9:30 PM",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function Calendar({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", color: "#6b6560", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: "#1a1a1a", fontWeight: 400 }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", color: "#6b6560", display: "flex", alignItems: "center" }}>
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "6px" }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", color: "#b0aa9f", padding: "4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          cellDate.setHours(0, 0, 0, 0);
          const isPast = cellDate < today;
          const isSelected = selected
            ? selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day
            : false;
          const isToday = cellDate.getTime() === today.getTime();
          return (
            <button key={i} disabled={isPast} onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
              style={{ border: "none", borderRadius: "10px", padding: "7px 0", cursor: isPast ? "default" : "pointer", background: isSelected ? "#1A1A1A" : isToday ? "rgba(26,26,26,0.07)" : "transparent", color: isSelected ? "#fff" : isPast ? "#d4cfca" : "#1a1a1a", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: isSelected ? 500 : isToday ? 500 : 400, transition: "background 0.15s ease", outline: "none" }}
              onMouseEnter={(e) => { if (!isPast && !isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(26,26,26,0.06)"; }}
              onMouseLeave={(e) => { if (!isPast && !isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >{day}</button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSlotBtn({ time, selected, onSelect }: { time: string; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} style={{ padding: "8px 4px", borderRadius: "10px", border: selected ? "1.5px solid #1A1A1A" : "1px solid rgba(0,0,0,0.08)", background: selected ? "#1A1A1A" : "rgba(255,255,255,0.7)", color: selected ? "#fff" : "#1a1a1a", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: selected ? 500 : 400, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.01em" }}>
      {time}
    </button>
  );
}

interface Props {
  initialBooking: BookingData | null;
  onProceed: (data: BookingData) => void;
}

export function BookingForm({ initialBooking, onProceed }: Props) {
  const [guests, setGuests] = useState(initialBooking?.guests ?? 2);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialBooking?.date ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialBooking?.time ?? null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false);
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) setShowTimeSlots(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });
  }

  function handleFindTable() {
    if (!selectedDate || !selectedTime) return;
    onProceed({ guests, date: selectedDate, time: selectedTime });
  }

  const canProceed = !!selectedDate && !!selectedTime;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #f5f4f0 0%, #e8e5de 40%, #d4cfc4 100%)", fontFamily: "'Inter', sans-serif", padding: "40px 16px" }}>
      <div style={{ position: "fixed", top: "-80px", right: "-60px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(180,170,155,0.35) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "60px", left: "-80px", width: "260px", height: "260px", borderRadius: "50%", background: "radial-gradient(circle, rgba(150,140,125,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "390px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", letterSpacing: "0.32em", color: "#8a8278", textTransform: "uppercase", marginBottom: "4px" }}>Der</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "38px", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.1, color: "#1a1a1a", margin: 0 }}>Ledera</h1>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 400, fontStyle: "italic", letterSpacing: "0.22em", color: "#6b6560", marginTop: "3px" }}>Wirthaus</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "18px" }}>
            <div style={{ width: "28px", height: "1px", background: "#c4bfb8" }} />
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#c4bfb8" }} />
            <div style={{ width: "28px", height: "1px", background: "#c4bfb8" }} />
          </div>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 300, letterSpacing: "0.04em", color: "#8a8278", marginTop: "12px", marginBottom: "32px", textAlign: "center" }}>
          Reservieren Sie Ihren Abend, mühelos.
        </p>

        {/* Card */}
        <div style={{ width: "100%", borderRadius: "24px", background: "rgba(255,255,255,0.52)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.72)", boxShadow: "0 8px 32px rgba(100,92,80,0.10), 0 1px 0 rgba(255,255,255,0.6) inset", padding: "28px 24px 24px" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.16em", color: "#9e988f", textTransform: "uppercase", marginBottom: "20px" }}>Tischreservierung</div>

          {/* Guests */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", color: "#b0aa9f", textTransform: "uppercase", marginBottom: "8px" }}>Anzahl der Gäste</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "14px", padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Users size={16} strokeWidth={1.5} color="#9e988f" />
                <span style={{ fontSize: "14px", color: "#1a1a1a" }}>{guests} {guests === 1 ? "Gast" : "Gäste"}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={() => setGuests(g => Math.max(1, g - 1))} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Minus size={12} strokeWidth={2} />
                </button>
                <button onClick={() => setGuests(g => Math.min(20, g + 1))} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#1A1A1A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Plus size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: "12px", position: "relative" }} ref={calRef}>
            <div style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", color: "#b0aa9f", textTransform: "uppercase", marginBottom: "8px" }}>Datum wählen</div>
            <button onClick={() => { setShowCalendar(v => !v); setShowTimeSlots(false); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: showCalendar ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)", border: showCalendar ? "1px solid rgba(26,26,26,0.18)" : "1px solid rgba(255,255,255,0.7)", borderRadius: showCalendar ? "14px 14px 0 0" : "14px", padding: "14px 16px", cursor: "pointer", transition: "all 0.2s" }}>
              <span style={{ fontSize: "14px", color: selectedDate ? "#1a1a1a" : "#c4bfb8", fontFamily: "'Inter', sans-serif" }}>{selectedDate ? formatDate(selectedDate) : "Datum auswählen"}</span>
              <ChevronDown size={15} strokeWidth={1.5} color="#9e988f" style={{ transform: showCalendar ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>
            <AnimatePresence>
              {showCalendar && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                  style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(26,26,26,0.12)", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "16px 12px 18px", boxShadow: "0 12px 32px rgba(100,92,80,0.14)" }}>
                  <Calendar selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setShowCalendar(false); }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time */}
          <div style={{ position: "relative" }} ref={timeRef}>
            <div style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", color: "#b0aa9f", textTransform: "uppercase", marginBottom: "8px" }}>Uhrzeit wählen</div>
            <button onClick={() => { setShowTimeSlots(v => !v); setShowCalendar(false); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: showTimeSlots ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)", border: showTimeSlots ? "1px solid rgba(26,26,26,0.18)" : "1px solid rgba(255,255,255,0.7)", borderRadius: showTimeSlots ? "14px 14px 0 0" : "14px", padding: "14px 16px", cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Clock size={16} strokeWidth={1.5} color="#9e988f" />
                <span style={{ fontSize: "14px", color: selectedTime ? "#1a1a1a" : "#c4bfb8", fontFamily: "'Inter', sans-serif" }}>{selectedTime || "Uhrzeit auswählen"}</span>
              </div>
              <ChevronDown size={15} strokeWidth={1.5} color="#9e988f" style={{ transform: showTimeSlots ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>
            <AnimatePresence>
              {showTimeSlots && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                  style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(26,26,26,0.12)", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "14px 14px 16px", boxShadow: "0 12px 32px rgba(100,92,80,0.14)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", color: "#b0aa9f", textTransform: "uppercase", marginBottom: "10px" }}>Mittagessen</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "14px" }}>
                    {TIME_SLOTS.slice(0, 6).map(t => <TimeSlotBtn key={t} time={t} selected={selectedTime === t} onSelect={() => { setSelectedTime(t); setShowTimeSlots(false); }} />)}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", color: "#b0aa9f", textTransform: "uppercase", marginBottom: "10px" }}>Abendessen</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                    {TIME_SLOTS.slice(6).map(t => <TimeSlotBtn key={t} time={t} selected={selectedTime === t} onSelect={() => { setSelectedTime(t); setShowTimeSlots(false); }} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleFindTable} disabled={!canProceed}
            style={{ marginTop: "24px", width: "100%", padding: "17px 24px", borderRadius: "14px", background: canProceed ? "#1A1A1A" : "#c4bfb8", color: "#ffffff", border: "none", cursor: canProceed ? "pointer" : "default", fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 500, letterSpacing: "0.08em", transition: "background 0.2s ease, box-shadow 0.2s ease", boxShadow: canProceed ? "0 4px 18px rgba(26,26,26,0.22)" : "none" }}>
            Tisch finden →
          </button>

          <p style={{ textAlign: "center", marginTop: "14px", fontSize: "11.5px", fontWeight: 400, color: "#b0aa9f", letterSpacing: "0.02em" }}>
            Kostenlose Stornierung bis 24 Stunden vorher
          </p>
        </div>

        <div style={{ marginTop: "28px", display: "flex", gap: "6px" }}>
          <div style={{ width: "20px", height: "6px", borderRadius: "3px", background: "#1A1A1A" }} />
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c4bfb8" }} />
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c4bfb8" }} />
        </div>
      </div>
    </div>
  );
}
