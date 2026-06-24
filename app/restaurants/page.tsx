'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, MapPin, Utensils, Calendar, ChevronRight, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { useLang } from '@/components/i18n/LanguageProvider'
import { restaurantsT } from '@/lib/i18n/translations'

interface PublicRestaurant {
  id:              string
  name:            string
  slug:            string
  description:     string | null
  cuisine_type:    string | null
  city:            string | null
  address:         string | null
  phone:           string | null
  cover_image_url: string | null
}

const CUISINE_COLORS: Record<string, string> = {
  austrian:  'bg-amber-50 text-amber-700',
  german:    'bg-orange-50 text-orange-700',
  italian:   'bg-red-50 text-red-700',
  sushi:     'bg-blue-50 text-blue-700',
  asian:     'bg-purple-50 text-purple-700',
  greek:     'bg-sky-50 text-sky-700',
  french:    'bg-rose-50 text-rose-700',
}

function cuisineColor(c: string | null) {
  if (!c) return 'bg-zinc-100 text-zinc-600'
  return CUISINE_COLORS[c.toLowerCase()] ?? 'bg-emerald-50 text-emerald-700'
}

function RestaurantCard({ r, bookLabel, noDescLabel }: {
  r: PublicRestaurant
  bookLabel: string
  noDescLabel: string
}) {
  const initials = r.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="group bg-white dark:bg-[var(--surface-card)] rounded-2xl border border-zinc-100 dark:border-[var(--border-card)] shadow-sm hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-600 transition-all duration-200 overflow-hidden flex flex-col">
      <div className="h-36 bg-gradient-to-br from-[#0D472B] to-[#1a6b45] flex items-center justify-center shrink-0 relative overflow-hidden">
        {r.cover_image_url ? (
          <img src={r.cover_image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-4xl font-bold text-white/30 select-none" style={{ fontFamily: 'var(--font-dm-serif, serif)' }}>
            {initials}
          </span>
        )}
        {r.cuisine_type && (
          <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${cuisineColor(r.cuisine_type)}`}>
            {r.cuisine_type}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-[var(--text-base)] leading-tight">{r.name}</h3>
          {r.city && (
            <p className="flex items-center gap-1 text-xs text-zinc-400 dark:text-[var(--text-faint)] mt-1">
              <MapPin size={11} /> {r.city}
            </p>
          )}
        </div>

        {r.description ? (
          <p className="text-sm text-zinc-500 dark:text-[var(--text-muted)] leading-relaxed line-clamp-2 flex-1">
            {r.description}
          </p>
        ) : (
          <p className="text-sm text-zinc-300 dark:text-zinc-600 italic flex-1">{noDescLabel}</p>
        )}

        <Link
          href={`/book/${r.slug}`}
          className="mt-auto flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0D472B] hover:bg-[#0b3d24] text-white text-sm font-semibold transition-colors btn-press"
        >
          <Calendar size={14} /> {bookLabel}
          <ChevronRight size={14} className="opacity-70" />
        </Link>
      </div>
    </div>
  )
}

export default function RestaurantsPage() {
  const { lang } = useLang()
  const tx = restaurantsT[lang]

  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [cityFilter, setCityFilter]   = useState('')

  useEffect(() => {
    fetch('/api/restaurants/public')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setRestaurants(Array.isArray(d) ? d : [])
      })
      .catch(() => setError(tx.error))
      .finally(() => setLoading(false))
  }, [])

  const cities = useMemo(() =>
    [...new Set(restaurants.map(r => r.city).filter(Boolean) as string[])].sort()
  , [restaurants])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return restaurants.filter(r => {
      const matchSearch = !q
        || r.name.toLowerCase().includes(q)
        || (r.cuisine_type?.toLowerCase().includes(q) ?? false)
        || (r.city?.toLowerCase().includes(q) ?? false)
        || (r.description?.toLowerCase().includes(q) ?? false)
      const matchCity = !cityFilter || r.city === cityFilter
      return matchSearch && matchCity
    })
  }, [restaurants, search, cityFilter])

  return (
    <div className="min-h-screen bg-[#F4F6F4] dark:bg-[var(--surface-alt)] transition-colors duration-200"
      style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>

      {/* Nav */}
      <nav className="bg-[#0D472B] px-6 pt-5 pb-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center backdrop-blur">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">Reservely</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle onDark />
            <ThemeToggle onDark />
            <Link href="/for-restaurants" className="text-white/60 hover:text-white text-xs font-medium transition-colors">
              {tx.nav.forRestaurants}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-[#0D472B] px-6 py-12 text-center">
        <h1 style={{ fontFamily: 'var(--font-dm-serif, serif)' }} className="text-4xl text-white mb-2">
          {tx.hero.title}
        </h1>
        <p className="text-[#a8d4b8] text-sm mb-8">
          {tx.hero.subtitle}
        </p>

        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-2xl px-4 h-13 shadow-lg focus-within:ring-2 focus-within:ring-emerald-400/40 transition-shadow">
            <Search size={18} className="text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tx.search.placeholder}
              className="flex-1 text-sm text-zinc-900 dark:text-white outline-none bg-transparent py-3.5 placeholder:text-zinc-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-zinc-500">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters + results */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {cities.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setCityFilter('')}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
                !cityFilter
                  ? 'bg-[#0D472B] text-white border-[#0D472B]'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              }`}
            >
              {tx.filter.allCities}
            </button>
            {cities.map(city => (
              <button
                key={city}
                onClick={() => setCityFilter(city === cityFilter ? '' : city)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
                  cityFilter === city
                    ? 'bg-[#0D472B] text-white border-[#0D472B]'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {!loading && !error && (
          <p className="text-xs text-zinc-400 dark:text-[var(--text-faint)] mb-5">
            {tx.count(filtered.length)}
          </p>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white dark:bg-[var(--surface-card)] rounded-2xl border border-zinc-100 dark:border-[var(--border-card)] overflow-hidden animate-pulse">
                <div className="h-36 bg-zinc-100 dark:bg-zinc-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
                  <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <Utensils size={40} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">{tx.noResults}</p>
            <p className="text-zinc-400 dark:text-[var(--text-faint)] text-sm mt-1">
              {search ? tx.noResultsQ(search) : tx.noListed}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 text-sm text-[#0D472B] dark:text-emerald-400 hover:underline">
                {tx.clearSearch}
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(r => (
              <RestaurantCard key={r.id} r={r} bookLabel={tx.book} noDescLabel={tx.noDesc} />
            ))}
          </div>
        )}
      </div>

      <div className="pb-12" />
    </div>
  )
}
