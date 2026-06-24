'use client'

import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface AuditLog {
  id: string
  created_at: string
  action: string
  actor_name: string | null
  metadata: {
    reference_code?: string
    guest_name?: string
    email?: string
  } | null
}

export function AuditClient({ logs }: { logs: AuditLog[] }) {
  const { lang } = useLang()
  const tx = dashboardT[lang].audit
  const locale = lang === 'EN' ? 'en-GB' : 'de-AT'

  return (
    <div className="p-5">
      <div className="mb-5">
        <h1 className="text-sm font-semibold text-gray-900">{tx.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{tx.subtitle}</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">{tx.empty}</p>
          <p className="text-xs text-zinc-400 mt-1">{tx.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 bg-white border border-zinc-200
                         rounded-lg px-4 py-3 text-xs"
            >
              <div className="w-36 shrink-0 text-zinc-400 tabular-nums pt-0.5">
                {new Date(log.created_at).toLocaleString(locale, {
                  day: '2-digit', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-zinc-900">
                  {(tx.actions as Record<string, string>)[log.action] ?? log.action}
                </span>
                {log.metadata?.reference_code && (
                  <span className="text-zinc-400 ml-1.5">
                    · {log.metadata.reference_code}
                  </span>
                )}
                {log.metadata?.guest_name && (
                  <span className="text-zinc-400 ml-1">
                    ({log.metadata.guest_name})
                  </span>
                )}
                {log.metadata?.email && (
                  <span className="text-zinc-400 ml-1.5">
                    · {log.metadata.email}
                  </span>
                )}
              </div>
              <div className="shrink-0 text-zinc-400">
                {log.actor_name ?? tx.system}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
