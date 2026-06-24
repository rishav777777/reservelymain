'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, ChevronRight, Utensils, Calendar, Star,
  ArrowRight, Clock, Users, TrendingUp, PartyPopper, ChefHat, Wine,
  Quote, ChevronLeft,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { useLang } from '@/components/i18n/LanguageProvider'
import { homeT, footerT } from '@/lib/i18n/translations'

interface PublicRestaurant {
  id:              string
  name:            string
  slug:            string
  description:     string | null
  cuisine_type:    string | null
  city:            string | null
  cover_image_url: string | null
}

const STAT_ICONS   = [Calendar, Utensils, TrendingUp, Clock]
const STAT_NUMS    = [2400, 40, 98, null] as (number | null)[]

// ── Animated counter ────────────────────────────────────────────────────────
function AnimatedCounter({ num, suffix = '', display }: { num: number | null; suffix?: string; display?: string }) {
  const [shown, setShown] = useState(0)
  const ref   = useRef<HTMLSpanElement>(null)
  const fired = useRef(false)

  useEffect(() => {
    if (num === null) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || fired.current) return
      fired.current = true
      const t0 = Date.now()
      const dur = 1600
      const tick = () => {
        const p = Math.min((Date.now() - t0) / dur, 1)
        setShown(Math.round((1 - Math.pow(1 - p, 3)) * num))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      io.disconnect()
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [num])

  if (display) return <span ref={ref}>{display}</span>
  return <span ref={ref}>{shown.toLocaleString()}{suffix}</span>
}

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.12 })
    document.querySelectorAll('.rv-animate').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ── Restaurant card ──────────────────────────────────────────────────────────
function RestaurantCard({ r, delay, bookLabel, availLabel }: {
  r: PublicRestaurant
  delay: number
  bookLabel: string
  availLabel: string
}) {
  const initials = r.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const hue = ((r.name.charCodeAt(0) + r.name.charCodeAt(1)) * 23) % 360
  return (
    <Link href={`/book/${r.slug}`}
      className={`rv-animate rv-animate-delay-${delay} group bg-white dark:bg-[var(--surface-card)] rounded-2xl border border-zinc-100 dark:border-[var(--border-card)] shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-zinc-200 dark:hover:border-zinc-600 transition-all duration-300 overflow-hidden flex flex-col`}>
      <div className="h-44 flex items-center justify-center relative overflow-hidden shrink-0"
        style={{ background: `linear-gradient(135deg, hsl(${hue},45%,20%) 0%, hsl(${hue},50%,35%) 100%)` }}>
        {r.cover_image_url
          ? <img src={r.cover_image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : (
            <span className="text-6xl font-extrabold text-white/15 select-none leading-none"
              style={{ fontFamily: 'var(--font-dm-serif, serif)' }}>{initials}</span>
          )
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {r.cuisine_type && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 backdrop-blur text-zinc-700 px-2.5 py-1 rounded-full">
            {r.cuisine_type}
          </span>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
          <Star size={9} className="fill-amber-400 text-amber-400" /> 4.9
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-[var(--text-base)] leading-tight">{r.name}</h3>
          {r.city && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-[var(--text-faint)] shrink-0">
              <MapPin size={9} /> {r.city}
            </span>
          )}
        </div>
        {r.description && (
          <p className="text-xs text-zinc-500 dark:text-[var(--text-muted)] line-clamp-2 leading-relaxed flex-1">{r.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-50 dark:border-[var(--border-base)]">
          <span className="text-xs text-[#0D472B] dark:text-emerald-400 font-bold flex items-center gap-1">
            {bookLabel} <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/25 px-2 py-0.5 rounded-full">
            {availLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[var(--surface-card)] rounded-2xl border border-zinc-100 dark:border-[var(--border-card)] overflow-hidden animate-pulse">
      <div className="h-44 bg-zinc-100 dark:bg-zinc-800" />
      <div className="p-4 space-y-2.5">
        <div className="flex justify-between gap-3">
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
        </div>
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
      </div>
    </div>
  )
}

interface TestimonialItem { name: string; role: string; quote: string; stars: number }

// ── Testimonials carousel ────────────────────────────────────────────────────
function TestimonialsCarousel({ items }: { items: readonly TestimonialItem[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = items.length

  useEffect(() => {
    setActive(0)
  }, [items])

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive(i => (i + 1) % total), 5000)
    return () => clearInterval(t)
  }, [paused, total])

  const prev = () => setActive(i => (i - 1 + total) % total)
  const next = () => setActive(i => (i + 1) % total)

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          style={{
            display: 'flex',
            transform: `translateX(-${active * 100}%)`,
            transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {items.map(({ name, role, quote, stars }) => (
            <div key={name} className="min-w-full px-1">
              <div className="bg-white dark:bg-[var(--surface-card)] rounded-2xl border border-zinc-100 dark:border-[var(--border-card)] p-8 flex flex-col gap-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote size={24} className="text-zinc-100 dark:text-zinc-700 shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed flex-1 italic">"{quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-50 dark:border-[var(--border-base)]">
                  <div className="w-9 h-9 rounded-full bg-[#0D472B]/10 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#0D472B] dark:text-emerald-400">{name[0]}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-[var(--text-base)]">{name}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-[var(--text-faint)]">{role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={prev} aria-label="Previous"
          className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white transition-all active:scale-90">
          <ChevronLeft size={14} />
        </button>
        <div className="flex gap-1.5">
          {items.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${i === active ? 'w-5 h-2 bg-[#0D472B] dark:bg-emerald-500' : 'w-2 h-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'}`}
            />
          ))}
        </div>
        <button onClick={next} aria-label="Next"
          className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white transition-all active:scale-90">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const { lang } = useLang()
  const tx = homeT[lang]

  const [query, setQuery]             = useState('')
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([])
  const [loading, setLoading]         = useState(true)

  useReveal()

  useEffect(() => {
    fetch('/api/restaurants/public')
      .then(r => r.json())
      .then(d => setRestaurants(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    router.push(query.trim() ? `/restaurants?q=${encodeURIComponent(query.trim())}` : '/restaurants')
  }

  const featured = restaurants.slice(0, 6)

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="absolute top-0 inset-x-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white text-sm font-extrabold">R</span>
            </div>
            <span className="text-white font-bold text-sm tracking-tight">Reservely</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle onDark />
            <ThemeToggle onDark />
            <Link href="/for-restaurants"
              className="hidden sm:block text-white/70 hover:text-white text-xs font-medium transition-colors border border-white/20 hover:border-white/40 px-3.5 py-1.5 rounded-lg backdrop-blur btn-press">
              {tx.nav.forRestaurants}
            </Link>
            <Link href="/login"
              className="text-xs font-bold bg-white text-[#0D472B] hover:bg-white/90 px-4 py-1.5 rounded-lg transition-all shadow-lg btn-press">
              {tx.nav.login}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0a3520 0%, #0D472B 50%, #125233 100%)',
        minHeight: '520px',
      }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-[15%] w-96 h-96 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div style={{ animation: 'rv-fade-up 0.7s cubic-bezier(0.4,0,0.2,1) both' }}>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {tx.hero.badge}
              </div>
              <h1 className="text-4xl sm:text-[52px] font-extrabold text-white leading-[1.1] mb-4 tracking-tight"
                style={{ fontFamily: 'var(--font-dm-serif, serif)' }}>
                {tx.hero.title1}<br />
                <span style={{
                  background: 'linear-gradient(90deg, #6EE7B7, #34D399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>{tx.hero.title2}</span>
              </h1>
              <p className="text-white/55 text-base mb-8 max-w-sm leading-relaxed">
                {tx.hero.subtitle}
              </p>

              <form onSubmit={handleSearch}
                className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-2xl px-4 h-[54px] shadow-2xl shadow-black/30 max-w-lg mb-5 ring-0 focus-within:ring-2 focus-within:ring-emerald-400/40 transition-shadow">
                <Search size={17} className="text-zinc-400 shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={tx.hero.searchPlaceholder}
                  className="flex-1 text-sm text-zinc-900 dark:text-white outline-none bg-transparent placeholder:text-zinc-400"
                />
                <button type="submit"
                  className="bg-[#0D472B] hover:bg-[#0a3520] text-white text-xs font-bold px-5 h-9 rounded-xl transition-all btn-press shrink-0">
                  {tx.hero.searchButton}
                </button>
              </form>

              <div className="flex gap-2 flex-wrap">
                {tx.cuisines.map(({ label, emoji }) => (
                  <Link key={label} href={`/restaurants?q=${encodeURIComponent(label)}`}
                    className="flex items-center gap-1.5 text-xs text-white/65 hover:text-white bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-full transition-all hover:scale-[1.04] btn-press">
                    <span>{emoji}</span> {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Floating preview card */}
            <div className="hidden lg:flex items-center justify-center"
              style={{ animation: 'rv-fade-up 0.7s 0.15s cubic-bezier(0.4,0,0.2,1) both' }}>
              <div className="relative">
                <div className="bg-white dark:bg-[var(--surface-card)] rounded-2xl shadow-2xl shadow-black/30 p-5 w-72 border border-zinc-100 dark:border-[var(--border-card)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D472B] to-[#1a6b45] flex items-center justify-center">
                      <Utensils size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-[var(--text-base)]">Gasthaus Zum Wohl</p>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1"><MapPin size={9} /> Vienna, Austria</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {['19:00', '19:30', '20:00'].map(t => (
                      <div key={t} className={`text-center text-xs font-semibold py-2 rounded-lg border transition-colors cursor-pointer hover:scale-[1.03] ${
                        t === '19:30'
                          ? 'bg-[#0D472B] text-white border-[#0D472B]'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-100 dark:border-zinc-700 hover:border-zinc-300'
                      }`}>{t}</div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-1.5">
                      <Users size={12} className="text-zinc-500" />
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{tx.hero.card.guests}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Calendar size={11} /> {tx.hero.card.tonight}
                    </div>
                  </div>
                  <button className="w-full bg-[#0D472B] hover:bg-[#0a3520] text-white text-xs font-bold py-2.5 rounded-xl transition-all btn-press">
                    {tx.hero.card.confirmBtn}
                  </button>
                </div>
                <div className="absolute -top-3 -right-4 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> {tx.hero.card.confirmed}
                </div>
                <div className="absolute -bottom-4 -left-6 bg-white dark:bg-[var(--surface-card)] rounded-xl shadow-xl p-3 border border-zinc-100 dark:border-[var(--border-card)] flex items-center gap-2.5 w-44">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-800 dark:text-[var(--text-base)]">{tx.hero.card.excellent}</p>
                    <p className="text-[10px] text-zinc-400">4.9 · 128 {tx.hero.card.reviews}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tx.stats.map((stat, i) => {
            const Icon = STAT_ICONS[i]
            const num  = STAT_NUMS[i]
            return (
              <div key={stat.label}
                className={`rv-animate rv-animate-delay-${i + 1} flex items-center gap-3 group`}>
                <div
                  className="w-9 h-9 rounded-xl bg-[#0D472B]/8 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200"
                  data-tooltip={stat.label}>
                  <Icon size={16} className="text-[#0D472B] dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-zinc-900 dark:text-[var(--text-base)] leading-none tabular-nums">
                    {'display' in stat
                      ? <AnimatedCounter num={null} display={stat.display} />
                      : <AnimatedCounter num={num} suffix={'suffix' in stat ? stat.suffix : ''} />
                    }
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-[var(--text-faint)] mt-0.5">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FEATURED RESTAURANTS ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="rv-animate flex items-end justify-between mb-7">
          <div>
            <p className="text-xs font-bold text-[#0D472B] dark:text-emerald-400 uppercase tracking-widest mb-1">{tx.restaurants.eyebrow}</p>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-[var(--text-base)]">{tx.restaurants.heading}</h2>
          </div>
          <Link href="/restaurants"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#0D472B] dark:text-emerald-400 hover:text-[#0a3520] dark:hover:text-emerald-300 transition-colors group">
            {tx.restaurants.viewAll} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[var(--surface-card)] rounded-2xl border border-zinc-100 dark:border-[var(--border-card)]">
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Utensils size={28} className="text-zinc-200 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-semibold text-sm">{tx.restaurants.empty}</p>
            <p className="text-zinc-400 text-xs mt-1">
              <Link href="/for-restaurants" className="text-[#0D472B] dark:text-emerald-400 hover:underline">{tx.restaurants.emptyAdd}</Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((r, i) => (
              <RestaurantCard
                key={r.id} r={r}
                delay={Math.min(i + 1, 6) as 1|2|3|4|5|6}
                bookLabel={tx.restaurants.book}
                availLabel={tx.restaurants.available}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── GROUP EVENTS ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="rv-animate rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #0a3520 0%, #0D472B 60%, #125233 100%)' }}>
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }} />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/20 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <PartyPopper size={12} /> {tx.groupEvents.badge}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight"
                style={{ fontFamily: 'var(--font-dm-serif, serif)' }}>
                {tx.groupEvents.title1}<br />
                <span style={{
                  background: 'linear-gradient(90deg, #FCD34D, #F59E0B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>{tx.groupEvents.title2}</span>
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-sm">
                {tx.groupEvents.subtitle}
              </p>
              <div className="flex flex-col gap-2.5 mb-8">
                {tx.groupEvents.bullets.map((text, i) => {
                  const icons = [Users, ChefHat, Wine]
                  const Icon = icons[i]
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/20 flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-amber-300" />
                      </div>
                      <span className="text-white/65 text-sm">{text}</span>
                    </div>
                  )
                })}
              </div>
              <Link href="/group-booking"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold text-sm px-7 py-3.5 rounded-2xl transition-all shadow-xl shadow-amber-400/20 btn-press">
                {tx.groupEvents.cta} <ArrowRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {tx.groupEvents.eventTypes.map(({ emoji, title, desc }) => (
                <Link key={title} href="/group-booking"
                  className="group bg-white/6 hover:bg-white/12 border border-white/10 hover:border-amber-400/30 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200 inline-block">{emoji}</div>
                  <p className="text-white font-bold text-sm mb-0.5">{title}</p>
                  <p className="text-white/40 text-xs">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a3520 0%, #0D472B 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="rv-animate text-center mb-10">
            <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-widest mb-2">{tx.howItWorks.eyebrow}</p>
            <h2 className="text-2xl font-extrabold text-white">{tx.howItWorks.heading}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            <div className="hidden sm:block absolute top-7 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-white/10 z-0" />
            {tx.howItWorks.steps.map(({ title, body }, i) => {
              const icons = [Search, Calendar, Utensils]
              const Icon  = icons[i]
              const step  = String(i + 1).padStart(2, '0')
              return (
                <div key={i}
                  className={`rv-animate rv-animate-delay-${i + 1} flex flex-col items-center text-center gap-4 relative z-10`}>
                  <div className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 flex items-center justify-center transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-400/10">
                    <Icon size={20} className="text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{step}</p>
                    <p className="text-sm font-bold text-white mb-1.5">{title}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{body}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/restaurants"
              className="inline-flex items-center gap-2 bg-white text-[#0D472B] font-bold text-sm px-7 py-3.5 rounded-2xl hover:bg-zinc-100 transition-all shadow-xl btn-press">
              <Search size={15} /> {tx.howItWorks.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#F4F6F4] dark:bg-[var(--surface-alt)] transition-colors duration-200">
        <div className="max-w-xl mx-auto">
          <div className="rv-animate text-center mb-10">
            <p className="text-xs font-bold text-[#0D472B] dark:text-emerald-400 uppercase tracking-widest mb-2">{tx.testimonials.eyebrow}</p>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-[var(--text-base)]">
              {tx.testimonials.heading}
            </h2>
          </div>
          <div className="rv-animate">
            <TestimonialsCarousel items={tx.testimonials.items} />
          </div>
          <div className="text-center mt-8">
            <Link href="/for-restaurants"
              className="text-sm font-semibold text-[#0D472B] dark:text-emerald-400 hover:text-[#0a3520] dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 group">
              {tx.testimonials.addCta} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-zinc-900 dark:bg-zinc-950 pt-10 pb-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#0D472B] flex items-center justify-center">
                  <span className="text-white text-xs font-extrabold">R</span>
                </div>
                <span className="text-white font-bold text-sm">Reservely</span>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px]">
                {footerT[lang].desc}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">
                {footerT[lang].discover}
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { href: '/restaurants',     label: footerT[lang].links.allRestaurants },
                  { href: '/for-restaurants', label: footerT[lang].links.forRestaurants },
                  { href: '/login',           label: footerT[lang].links.login          },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">
                {footerT[lang].legal}
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { href: '/legal',     label: footerT[lang].legalLinks.allDocs   },
                  { href: '/privacy',   label: footerT[lang].legalLinks.privacy   },
                  { href: '/cookies',   label: footerT[lang].legalLinks.cookies   },
                  { href: '/terms',     label: footerT[lang].legalLinks.terms     },
                  { href: '/impressum', label: footerT[lang].legalLinks.impressum },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5">
            <p className="text-zinc-600 text-xs">
              © {new Date().getFullYear()} Reservely · {footerT[lang].copyright}
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <a href="mailto:hallo@reservely.app" className="hover:text-zinc-400 transition-colors">{footerT[lang].email}</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
