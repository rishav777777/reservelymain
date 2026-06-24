'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

export default function LoginPage() {
  const router = useRouter()
  const { lang } = useLang()
  const tx = dashboardT[lang].login
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [resetSent, setResetSent]   = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError(tx.enterEmail)
      return
    }
    setResetLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) {
      setError(error.message)
      setResetLoading(false)
      return
    }
    setResetSent(true)
    setResetLoading(false)
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
        <CardDescription className="text-xs text-gray-500">
          {tx.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-medium text-gray-700">{tx.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-medium text-gray-700">{tx.password}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-8 text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-8 text-sm bg-brand-primary hover:bg-brand-primary/90 text-white"
            disabled={loading}
          >
            {loading ? tx.signingIn : tx.signIn}
          </Button>

          <div className="text-center pt-1">
            {resetSent ? (
              <p className="text-xs text-emerald-600">
                {tx.resetSent}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {resetLoading ? tx.sending : tx.forgot}
              </button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
