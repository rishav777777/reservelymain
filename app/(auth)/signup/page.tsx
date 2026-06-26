'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

export default function SignupPage() {
  const { lang } = useLang()
  const tx = dashboardT[lang].signup

  const [form, setForm] = useState({
    contactName:     '',
    restaurantName:  '',
    email:           '',
    phone:           '',
    city:            '',
    venueType:       '',
    message:         '',
    password:        '',
    confirmPassword: '',
  })
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError(tx.passwordHint)
      return
    }
    if (form.password !== form.confirmPassword) {
      setError(tx.passwordMismatch)
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName:       form.contactName,
        restaurantName: form.restaurantName,
        email:          form.email,
        password:       form.password,
        phone:          form.phone || null,
        city:           form.city,
        venueType:      form.venueType || null,
        message:        form.message || null,
      }),
    })
    const json = await res.json() as { success?: boolean; error?: string }

    if (!res.ok) {
      setError(json.error ?? tx.errorGeneric)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm shadow-sm border border-gray-200 text-center">
        <CardContent className="pt-8 pb-6 space-y-3">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
          <p className="text-sm font-semibold text-zinc-900">{tx.successTitle}</p>
          <p className="text-xs text-zinc-400 leading-relaxed">{tx.successBody}</p>
          <Link href="/login" className="block text-xs text-zinc-500 hover:text-zinc-700 mt-2 transition-colors">
            {tx.signInLink} →
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-sm border border-gray-200">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Reservely</span>
        </div>
        <CardTitle className="text-lg font-semibold text-gray-900">{tx.title}</CardTitle>
        <CardDescription className="text-xs text-gray-500">{tx.subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="contactName" className="text-xs font-medium text-gray-700">{tx.fullName}</Label>
            <Input id="contactName" type="text" placeholder="Max Mustermann" value={form.contactName} onChange={set('contactName')} required className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="restaurantName" className="text-xs font-medium text-gray-700">{tx.restaurantName}</Label>
            <Input id="restaurantName" type="text" placeholder="Gasthaus Zum Wohl" value={form.restaurantName} onChange={set('restaurantName')} required className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-medium text-gray-700">{tx.email}</Label>
            <Input id="email" type="email" placeholder="you@restaurant.com" value={form.email} onChange={set('email')} required className="h-8 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-medium text-gray-700">{tx.phone}</Label>
              <Input id="phone" type="tel" placeholder="+43 ..." value={form.phone} onChange={set('phone')} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city" className="text-xs font-medium text-gray-700">{tx.city}</Label>
              <Input id="city" type="text" placeholder="Wien" value={form.city} onChange={set('city')} required className="h-8 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="venueType" className="text-xs font-medium text-gray-700">{tx.venueType}</Label>
            <select
              id="venueType"
              value={form.venueType}
              onChange={set('venueType')}
              className="w-full h-8 text-sm border border-input rounded-md px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">{tx.venueTypePlaceholder}</option>
              {tx.venueTypes.map((v: string) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="message" className="text-xs font-medium text-gray-700">{tx.message}</Label>
            <textarea
              id="message"
              value={form.message}
              onChange={set('message')}
              rows={2}
              placeholder={tx.messagePlaceholder}
              className="w-full text-sm border border-input rounded-md px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="border-t border-zinc-100 pt-3 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-medium text-gray-700">{tx.password}</Label>
              <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={8} className="h-8 text-sm" />
              <p className="text-[10px] text-zinc-400">{tx.passwordHint}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">{tx.confirmPassword}</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required className="h-8 text-sm" />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full h-8 text-sm bg-brand-primary hover:bg-brand-primary/90 text-white" disabled={loading}>
            {loading ? tx.sending : tx.submitRequest}
          </Button>

          <p className="text-center text-xs text-zinc-400 pt-1">
            {tx.hasAccount}{' '}
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">{tx.signInLink}</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
