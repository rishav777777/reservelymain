'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#10B981',
  arrived:   '#3B82F6',
  completed: '#6B7280',
  pending:   '#F59E0B',
  rejected:  '#EF4444',
  cancelled: '#F87171',
  no_show:   '#9CA3AF',
}

interface DayData    { date: string; online: number; walkIn: number }
interface HourData   { hour: string; count: number }
interface StatusData { status: string; count: number }
interface Summary {
  total: number
  approvalRate:     number | null
  noShowRate:       number | null
  cancellationRate: number | null
}
interface AnalyticsData {
  reservationsPerDay: DayData[]
  peakHours:          HourData[]
  statusBreakdown:    StatusData[]
  summary:            Summary
}

const DAY_OPTIONS = [7, 14, 30] as const

export function AnalyticsClient({ initialData }: { initialData: AnalyticsData }) {
  const [data, setData]       = useState<AnalyticsData>(initialData)
  const [days, setDays]       = useState(30)
  const [loading, setLoading] = useState(false)
  const { lang } = useLang()
  const tx = dashboardT[lang].analytics

  async function changeDays(newDays: number) {
    if (newDays === days) return
    setDays(newDays)
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?days=${newDays}`)
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const locale = lang === 'EN' ? 'en-GB' : 'de-AT'
  const { summary, peakHours, statusBreakdown } = data
  const reservationsPerDay = data.reservationsPerDay.map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric' }),
  }))

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">{tx.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{tx.subtitle(summary.total, days)}</p>
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => changeDays(d)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label={tx.approvalRate}     value={summary.approvalRate} />
        <MetricCard label={tx.noShowRate}      value={summary.noShowRate} />
        <MetricCard label={tx.cancellationRate} value={summary.cancellationRate} />
      </div>

      <ChartCard title={tx.reservationsPerDay} loading={loading}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={reservationsPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
            <Bar dataKey="online" name="Online"  stackId="a" fill="#E63946" />
            <Bar dataKey="walkIn" name="Walk-in" stackId="a" fill="#F87171" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={tx.peakHours} loading={loading}>
        {peakHours.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">{tx.noData}</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakHours} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Bar dataKey="count" name="Reservations" fill="#E63946" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={tx.statusBreakdown} loading={loading}>
        {statusBreakdown.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">{tx.noData}</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {statusBreakdown.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) => value.replace(/_/g, ' ')}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-0.5">
        {value === null ? '—' : `${value}%`}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  loading,
  children,
}: {
  title: string
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 transition-opacity ${loading ? 'opacity-50' : ''}`}>
      <h2 className="text-xs font-semibold text-gray-700 mb-3">{title}</h2>
      {children}
    </div>
  )
}
