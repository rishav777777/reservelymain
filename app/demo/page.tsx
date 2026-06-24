import Link from 'next/link'
import { BookingClient } from '@/components/booking/BookingClient'

const DEMO_OPENING_HOURS: Record<number, { open: string; last: string | null }> = {
  0: { open: '11:30', last: '21:30' },
  1: { open: '11:30', last: '21:30' },
  2: { open: '11:30', last: '21:30' },
  3: { open: '11:30', last: '22:00' },
  4: { open: '11:30', last: '22:00' },
  5: { open: '12:00', last: '22:00' },
  6: { open: '12:00', last: '20:30' },
}

export default function DemoPage() {
  return (
    <div style={{ position: 'relative' }}>
      {/* Sticky banner */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'linear-gradient(90deg, #0D472B, #125233)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FCD34D', boxShadow: '0 0 8px rgba(252,211,77,0.6)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.4 }}>
            <strong style={{ color: '#fff' }}>Interactive demo</strong> — experience the full guest booking flow. No data is saved.
          </span>
        </div>
        <Link href="/for-restaurants" style={{
          flexShrink: 0, fontSize: '12px', fontWeight: 700, color: '#FCD34D',
          textDecoration: 'none', background: 'rgba(252,211,77,0.10)',
          border: '1px solid rgba(252,211,77,0.25)', borderRadius: '100px',
          padding: '5px 14px', whiteSpace: 'nowrap',
        }}>
          Set up your restaurant →
        </Link>
      </div>

      <BookingClient
        restaurantId=""
        restaurantSlug="demo"
        restaurantName="Wirtshaus zur Sonne"
        closedDays={new Set()}
        advanceBookingDays={90}
        openingHoursMap={DEMO_OPENING_HOURS}
        maxPartySize={12}
        demoMode
      />
    </div>
  )
}
