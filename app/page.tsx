'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Zap, MessageSquare, LayoutDashboard } from 'lucide-react'

const PAIN_POINTS = [
  'Existing tools are overpriced and built for enterprise, not your restaurant',
  'Phone calls for reservations waste staff time and lose bookings',
  'Resmio and OpenTable lock you into long contracts',
]

const FEATURES = [
  {
    icon: Calendar,
    title: 'Visual timeline dashboard',
    body: 'See every reservation at a glance. Approve, seat, and complete — all in one view.',
  },
  {
    icon: Zap,
    title: 'Auto table allocation',
    body: 'Best-fit algorithm assigns the right table automatically. No double-bookings.',
  },
  {
    icon: MessageSquare,
    title: 'Guest communication thread',
    body: 'Message guests directly from the reservation. No phone tag.',
  },
]

export default function LandingPage() {
  const [formData, setFormData] = useState({
    restaurantName: '', contactName: '', email: '',
    phone: '', city: '', venueType: '', message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleDemoRequest(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const body = await res.json()
        setFormError(body.error ?? 'Something went wrong')
        return
      }

      setSubmitted(true)
    } catch {
      setFormError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Nav */}
      <nav className="bg-brand-sidebar px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Reservely</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white text-xs transition-colors duration-150"
          >
            Go to dashboard →
          </Link>
          <Link
            href="/login"
            className="text-xs text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors duration-150"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary text-xs font-medium px-3 py-1 rounded-full mb-6 border border-brand-primary/20">
          Now in beta · Germany
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 tracking-tight leading-tight mb-5">
          The reservation platform<br />restaurants actually want to use.
        </h1>
        <p className="text-zinc-500 text-sm">Simple · Fast · GDPR-ready · From €19/month</p>
      </section>

      {/* Problem strip */}
      <section className="bg-brand-sidebar py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
          {PAIN_POINTS.map((text, i) => (
            <div key={i} className="text-center">
              <div className="w-1 h-4 bg-brand-primary rounded-full mx-auto mb-3" />
              <p className="text-zinc-400 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshot placeholder */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden">
          {/* Browser chrome */}
          <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
            </div>
            <div className="flex-1 bg-white rounded border border-zinc-200 px-3 py-1 text-xs text-zinc-400 text-center max-w-xs mx-auto">
              app.reservely.io/dashboard
            </div>
          </div>
          {/* Screenshot area */}
          <div className="aspect-video bg-zinc-50 flex items-center justify-center">
            {/* TODO: replace with real screenshot before investor meeting */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-3">
                <LayoutDashboard className="w-6 h-6 text-brand-primary" />
              </div>
              <p className="text-sm text-zinc-400 font-medium">Dashboard screenshot</p>
              <p className="text-xs text-zinc-300 mt-1">Replace with /public/screenshot.png</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-semibold text-zinc-900 text-center mb-8 tracking-tight">
          Everything you need. Nothing you don't.
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
              <div className="w-8 h-8 rounded-md bg-brand-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-brand-primary" />
              </div>
              <p className="text-sm font-semibold text-zinc-900 mb-1.5">{title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Request CTA */}
      <section className="bg-brand-sidebar py-16 px-6">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
              Request a Demo
            </h2>
            <p className="text-zinc-400 text-sm">
              Tell us about your restaurant and we'll set up your account personally.
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-6 py-8 text-center">
              <p className="text-emerald-400 text-sm font-medium mb-1">Request received</p>
              <p className="text-emerald-400/70 text-xs">
                We'll review your request and reach out within 1–2 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDemoRequest} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="restaurantName"
                  type="text"
                  placeholder="Restaurant / Café name"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  required
                  className="bg-white/10 border border-white/10 text-white placeholder:text-zinc-500 text-sm px-3 py-2.5 rounded-md focus:outline-none focus:border-white/30 transition-colors w-full"
                />
                <input
                  name="contactName"
                  type="text"
                  placeholder="Your name"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  className="bg-white/10 border border-white/10 text-white placeholder:text-zinc-500 text-sm px-3 py-2.5 rounded-md focus:outline-none focus:border-white/30 transition-colors w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-white/10 border border-white/10 text-white placeholder:text-zinc-500 text-sm px-3 py-2.5 rounded-md focus:outline-none focus:border-white/30 transition-colors w-full"
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-white/10 border border-white/10 text-white placeholder:text-zinc-500 text-sm px-3 py-2.5 rounded-md focus:outline-none focus:border-white/30 transition-colors w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="bg-white/10 border border-white/10 text-white placeholder:text-zinc-500 text-sm px-3 py-2.5 rounded-md focus:outline-none focus:border-white/30 transition-colors w-full"
                />
                <select
                  name="venueType"
                  value={formData.venueType}
                  onChange={handleChange}
                  required
                  className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-md focus:outline-none focus:border-white/30 transition-colors w-full"
                >
                  <option value="" disabled className="bg-zinc-800">Type of venue</option>
                  <option value="Restaurant" className="bg-zinc-800">Restaurant</option>
                  <option value="Café" className="bg-zinc-800">Café</option>
                  <option value="Hotel Dining" className="bg-zinc-800">Hotel Dining</option>
                  <option value="Other" className="bg-zinc-800">Other</option>
                </select>
              </div>
              <textarea
                name="message"
                placeholder="Tell us about your current reservation challenges (optional)"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                className="bg-white/10 border border-white/10 text-white placeholder:text-zinc-500 text-sm px-3 py-2.5 rounded-md focus:outline-none focus:border-white/30 transition-colors w-full resize-none"
              />
              {formError && (
                <p className="text-red-400 text-xs">{formError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium px-4 py-2.5 rounded-md transition-colors duration-150 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Request demo'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-sidebar border-t border-white/5 py-6 px-6 text-center">
        <p className="text-zinc-600 text-xs">
          © {new Date().getFullYear()} Reservely · Built for restaurants in Germany
        </p>
      </footer>
    </div>
  )
}