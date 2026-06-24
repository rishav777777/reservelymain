'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  CalendarDays, LayoutDashboard, Bell, Users, QrCode, BarChart3,
  CheckCircle2, ChevronDown, ArrowRight, Utensils, Star,
  ChevronLeft, ChevronRight, Quote, Zap, Phone, TrendingUp,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { useLang } from '@/components/i18n/LanguageProvider'
import { forRestaurantsT } from '@/lib/i18n/translations'

const FEATURE_ICONS  = [CalendarDays, LayoutDashboard, Bell, Users, QrCode, BarChart3]
const STAT_ICONS     = [Phone, TrendingUp, Zap]
const HOW_STEPS      = ['01', '02', '03']

// ── Scroll-reveal ─────────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.10 })
    document.querySelectorAll('.rv-animate').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group"
      >
        <span className="text-sm font-semibold text-zinc-800 dark:text-[var(--text-base)] group-hover:text-[#0D472B] dark:group-hover:text-emerald-400 transition-colors">
          {q}
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-[#0D472B] dark:text-emerald-400' : ''}`}
        />
      </button>
      <div
        ref={bodyRef}
        style={{
          maxHeight: open ? '300px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <p className="text-sm text-zinc-500 dark:text-[var(--text-muted)] leading-relaxed pb-5 pr-6">{a}</p>
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

  useEffect(() => { setActive(0) }, [items])
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
      <div className="overflow-hidden">
        <div style={{
          display: 'flex',
          transform: `translateX(-${active * 100}%)`,
          transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {items.map(({ name, role, quote, stars }) => (
            <div key={name} className="min-w-full px-1">
              <div className="bg-[#F4F6F4] dark:bg-[var(--surface-card)] rounded-2xl p-8 flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote size={22} className="text-zinc-200 dark:text-zinc-700 shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed italic flex-1">"{quote}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-zinc-200 dark:border-[var(--border-base)]">
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ForRestaurantsPage() {
  const { lang } = useLang()
  const tx = forRestaurantsT[lang]
  useReveal()

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--surface)] transition-colors duration-200"
      style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#0D472B] flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="text-zinc-900 dark:text-[var(--text-base)] font-semibold text-sm tracking-tight">Reservely</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/" className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white text-xs font-medium transition-colors">
              {tx.nav.forGuests}
            </Link>
            <a href="#pricing" className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white text-xs font-medium transition-colors">
              {tx.nav.pricing}
            </a>
            <Link href="/login"
              className="text-xs font-semibold bg-[#0D472B] hover:bg-[#0b3d24] text-white px-4 py-1.5 rounded-lg transition-all btn-press">
              {tx.nav.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#0D472B] px-6 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2" />
        <div className="max-w-3xl mx-auto text-center relative z-10"
          style={{ animation: 'rv-fade-up 0.7s cubic-bezier(0.4,0,0.2,1) both' }}>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Utensils size={11} /> {tx.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-dm-serif, serif)', whiteSpace: 'pre-line' }}>
            {tx.hero.title}
          </h1>
          <p className="text-white/60 text-base max-w-xl mx-auto mb-10">
            {tx.hero.subtitle}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-white text-[#0D472B] font-bold text-sm px-7 py-3.5 rounded-2xl hover:bg-zinc-100 transition-all shadow-lg btn-press">
              {tx.hero.cta} <ArrowRight size={15} />
            </Link>
            <a href="#demo"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors btn-press">
              {tx.hero.demo} <ChevronDown size={15} />
            </a>
          </div>
          <p className="text-white/30 text-xs mt-5">{tx.hero.disclaimer}</p>
        </div>
      </section>

      {/* ── OWNER STATS STRIP ─────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
        <div className="max-w-3xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
          {tx.ownerStats.map((stat, i) => {
            const Icon = STAT_ICONS[i]
            return (
              <div key={stat.label}
                className={`rv-animate rv-animate-delay-${i + 1} flex flex-col items-center text-center gap-1 group`}>
                <div className="w-9 h-9 rounded-xl bg-[#0D472B]/8 dark:bg-emerald-900/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-200">
                  <Icon size={16} className="text-[#0D472B] dark:text-emerald-400" />
                </div>
                <p className="text-xl font-extrabold text-zinc-900 dark:text-[var(--text-base)] leading-none">{stat.num}</p>
                <p className="text-[11px] text-zinc-400 dark:text-[var(--text-faint)]">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#F4F6F4] dark:bg-[var(--surface-alt)] transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <div className="rv-animate text-center mb-12">
            <p className="text-xs font-semibold text-[#0D472B] dark:text-emerald-400 uppercase tracking-widest mb-2">{tx.features.eyebrow}</p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-[var(--text-base)]">{tx.features.heading}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tx.features.items.map(({ title, body }, i) => {
              const Icon = FEATURE_ICONS[i]
              return (
                <div key={title}
                  className={`rv-animate rv-animate-delay-${Math.min(i + 1, 6)} group bg-white dark:bg-[var(--surface-card)] rounded-2xl border border-zinc-100 dark:border-[var(--border-card)] p-6 flex flex-col gap-3 hover:border-[#0D472B]/20 dark:hover:border-emerald-700/40 hover:shadow-lg transition-all duration-250 hover:-translate-y-0.5`}>
                  <div className="w-10 h-10 rounded-xl bg-[#0D472B]/10 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0D472B]/15 dark:group-hover:bg-emerald-900/50 transition-all duration-200">
                    <Icon size={18} className="text-[#0D472B] dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-[var(--text-base)] mb-1">{title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-[var(--text-muted)] leading-relaxed">{body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white dark:bg-[var(--surface)] transition-colors duration-200">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rv-animate">
            <p className="text-xs font-semibold text-[#0D472B] dark:text-emerald-400 uppercase tracking-widest mb-2">{tx.howItWorks.eyebrow}</p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-[var(--text-base)] mb-12">{tx.howItWorks.heading}</h2>
          </div>
          <div className="relative">
            <div className="hidden sm:block absolute top-6 left-[16.67%] right-[16.67%] h-px bg-zinc-100 dark:bg-zinc-800 z-0" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
              {tx.howItWorks.steps.map(({ title, body }, i) => (
                <div key={i} className={`rv-animate rv-animate-delay-${i + 1} flex flex-col items-center text-center gap-3`}>
                  <div className="w-12 h-12 rounded-full border-2 border-[#0D472B] dark:border-emerald-600 bg-white dark:bg-[var(--surface)] flex items-center justify-center hover:bg-[#0D472B] dark:hover:bg-emerald-600 hover:text-white transition-all group cursor-default">
                    <span className="text-[#0D472B] dark:text-emerald-400 group-hover:text-white font-bold text-sm transition-colors">{HOW_STEPS[i]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-[var(--text-base)] mb-1">{title}</p>
                    <p className="text-xs text-zinc-500 dark:text-[var(--text-muted)] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO ──────────────────────────────────────────────────────────── */}
      <section id="demo" className="py-16 px-6 bg-[#F4F6F4] dark:bg-[var(--surface-alt)] transition-colors duration-200">
        <div className="rv-animate max-w-xl mx-auto text-center">
          <p className="text-xs font-semibold text-[#0D472B] dark:text-emerald-400 uppercase tracking-widest mb-2">{tx.demo.eyebrow}</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-[var(--text-base)] mb-3">{tx.demo.heading}</h2>
          <p className="text-sm text-zinc-500 dark:text-[var(--text-muted)] mb-6">{tx.demo.subtitle}</p>
          <Link href="/demo"
            className="inline-flex items-center gap-2 bg-[#0D472B] hover:bg-[#0b3d24] text-white font-semibold text-sm px-7 py-3.5 rounded-2xl transition-all shadow-lg btn-press">
            {tx.demo.cta} <ArrowRight size={15} />
          </Link>
          <p className="text-xs text-zinc-400 dark:text-[var(--text-faint)] mt-3">{tx.demo.disclaimer}</p>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white dark:bg-[var(--surface)] transition-colors duration-200">
        <div className="max-w-2xl mx-auto">
          <div className="rv-animate text-center mb-10">
            <p className="text-xs font-semibold text-[#0D472B] dark:text-emerald-400 uppercase tracking-widest mb-2">{tx.testimonials.eyebrow}</p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-[var(--text-base)]">{tx.testimonials.heading}</h2>
          </div>
          <div className="rv-animate">
            <TestimonialsCarousel items={tx.testimonials.items} />
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-[#F4F6F4] dark:bg-[var(--surface-alt)] transition-colors duration-200">
        <div className="max-w-5xl mx-auto">
          <div className="rv-animate text-center mb-12">
            <p className="text-xs font-semibold text-[#0D472B] dark:text-emerald-400 uppercase tracking-widest mb-2">{tx.pricing.eyebrow}</p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-[var(--text-base)]">{tx.pricing.heading}</h2>
            <p className="text-sm text-zinc-400 dark:text-[var(--text-faint)] mt-2">{tx.pricing.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {tx.pricing.tiers.map(({ name, price, description, features, cta }, i) => {
              const highlight = i === 1
              const per = i === 0 ? tx.pricing.forever : tx.pricing.perMonth
              const href = i === 2 ? 'mailto:hello@reservely.app' : '/login'
              return (
                <div key={name}
                  className={[
                    `rv-animate rv-animate-delay-${i + 1}`,
                    'rounded-2xl p-6 flex flex-col gap-5 border transition-all duration-250',
                    highlight
                      ? 'bg-[#0D472B] border-[#0D472B] shadow-xl scale-[1.02]'
                      : 'bg-white dark:bg-[var(--surface-card)] border-zinc-100 dark:border-[var(--border-card)] hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-lg hover:-translate-y-0.5',
                  ].join(' ')}>
                  <div>
                    {highlight && (
                      <span className="text-xs font-semibold text-[#0D472B] bg-white px-2.5 py-0.5 rounded-full mb-3 inline-block">
                        {tx.pricing.mostPopular}
                      </span>
                    )}
                    <h3 className={`text-lg font-bold ${highlight ? 'text-white' : 'text-zinc-900 dark:text-[var(--text-base)]'}`}>{name}</h3>
                    <p className={`text-xs mt-1 ${highlight ? 'text-white/60' : 'text-zinc-400 dark:text-[var(--text-faint)]'}`}>{description}</p>
                  </div>
                  <div className={`text-3xl font-bold ${highlight ? 'text-white' : 'text-zinc-900 dark:text-[var(--text-base)]'}`}>
                    {price}<span className={`text-sm font-normal ml-1 ${highlight ? 'text-white/50' : 'text-zinc-400'}`}>/{per}</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 flex-1">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${highlight ? 'text-white/70' : 'text-[#0D472B] dark:text-emerald-400'}`} />
                        <span className={`text-xs leading-relaxed ${highlight ? 'text-white/80' : 'text-zinc-600 dark:text-[var(--text-muted)]'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={href}
                    className={`flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all btn-press ${
                      highlight
                        ? 'bg-white text-[#0D472B] hover:bg-zinc-100'
                        : 'bg-[#0D472B] text-white hover:bg-[#0b3d24]'
                    }`}
                    data-tooltip={highlight ? tx.pricing.mostPopular : undefined}>
                    {cta} <ArrowRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white dark:bg-[var(--surface)] transition-colors duration-200">
        <div className="max-w-2xl mx-auto">
          <div className="rv-animate text-center mb-10">
            <p className="text-xs font-semibold text-[#0D472B] dark:text-emerald-400 uppercase tracking-widest mb-2">{tx.faq.eyebrow}</p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-[var(--text-base)]">{tx.faq.heading}</h2>
          </div>
          <div className="rv-animate bg-[#F4F6F4] dark:bg-[var(--surface-card)] rounded-2xl px-6 transition-colors">
            {tx.faq.items.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#0D472B] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }} />
        <div className="rv-animate max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-dm-serif, serif)' }}>
            {tx.cta.heading}
          </h2>
          <p className="text-white/60 text-sm mb-8">{tx.cta.subtitle}</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-white text-[#0D472B] font-bold text-sm px-8 py-4 rounded-2xl hover:bg-zinc-100 transition-all shadow-xl btn-press">
            {tx.cta.button} <ArrowRight size={15} />
          </Link>
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
                {lang === 'DE'
                  ? 'Reservierungsmanagement für Restaurants – gebaut für Europa.'
                  : 'Restaurant reservation management — built for Europe.'}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">{tx.footer.platform}</p>
              <div className="flex flex-col gap-2">
                {tx.footer.platformLinks.map(({ href, label }) => (
                  <Link key={href} href={href} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">
                {lang === 'DE' ? 'Rechtliches' : 'Legal'}
              </p>
              <div className="flex flex-col gap-2">
                {(lang === 'DE'
                  ? [
                      { href: '/legal',     label: 'Alle Rechtsdokumente' },
                      { href: '/privacy',   label: 'Datenschutzerklärung' },
                      { href: '/cookies',   label: 'Cookie-Richtlinie'    },
                      { href: '/terms',     label: 'Nutzungsbedingungen'  },
                      { href: '/impressum', label: 'Impressum'            },
                    ]
                  : [
                      { href: '/legal',     label: 'All legal documents' },
                      { href: '/privacy',   label: 'Privacy Policy'      },
                      { href: '/cookies',   label: 'Cookie Policy'       },
                      { href: '/terms',     label: 'Terms of Service'    },
                      { href: '/impressum', label: 'Impressum'           },
                    ]
                ).map(({ href, label }) => (
                  <Link key={href} href={href} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5">
            <p className="text-zinc-600 text-xs">
              © {new Date().getFullYear()} Reservely · {lang === 'DE' ? 'EU-gehostet · DSGVO-konform' : 'EU-hosted · GDPR compliant'}
            </p>
            <a href="mailto:hallo@reservely.app" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">hallo@reservely.app</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
