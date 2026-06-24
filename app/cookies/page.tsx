'use client'

import { LegalLayout } from '@/components/legal/LegalLayout'
import { useLang } from '@/components/i18n/LanguageProvider'
import { legalT } from '@/lib/i18n/translations'

export default function CookiesPage() {
  const { lang } = useLang()
  const { title, subtitle, updatedAt } = legalT[lang].cookies
  return (
    <LegalLayout title={title} subtitle={subtitle} updatedAt={updatedAt} currentPath="/cookies">
      {lang === 'DE' ? <CookiesDE /> : <CookiesEN />}
    </LegalLayout>
  )
}

function CookiesEN() {
  return (
    <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
      <S num="1" title="What Are Cookies">
        <p>Cookies are small text files stored on your device when you visit a website. They are used to remember your session so you do not have to log in again on every page load.</p>
      </S>
      <S num="2" title="Cookies We Use">
        <p className="mb-4">Reservely uses only <strong className="text-zinc-800">technically necessary cookies</strong>. We do not use tracking cookies, advertising cookies, or analytics cookies.</p>
        <CookieTable
          headers={['Cookie name', 'Purpose', 'Duration', 'Type']}
          rows={[
            { name: 'sb-access-token',  purpose: 'Authentication session (Supabase)', duration: '1 hour',  type: 'Necessary' },
            { name: 'sb-refresh-token', purpose: 'Session renewal without re-login',  duration: '30 days', type: 'Necessary' },
          ]}
        />
      </S>
      <S num="3" title="No Consent Banner Required">
        <p>Under EU law (ePrivacy Directive and GDPR), a consent banner is required only for non-essential cookies — such as analytics, advertising, or tracking cookies. Because Reservely uses only technically necessary session cookies, no consent banner is shown.</p>
        <p className="mt-2">If we ever add optional analytics tools, we will update this policy and introduce a consent mechanism before doing so.</p>
      </S>
      <S num="4" title="Guest Booking Portal">
        <p>The guest booking portal{' '}
          <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono">/book/[slug]</code>{' '}
          stores a temporary session identifier in browser local storage (not a cookie) during the booking flow. This data is never transmitted to third parties and is automatically cleared after booking is submitted.</p>
      </S>
      <S num="5" title="Third-Party Services">
        <p>Reservely does not embed any third-party tracking scripts (Google Analytics, Meta Pixel, Hotjar, etc.). The only third-party service that may set a cookie is{' '}
          <strong className="text-zinc-800">Supabase</strong>, which provides our authentication system. Their privacy policy:{' '}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0D472B] hover:underline font-medium">supabase.com/privacy</a>.</p>
      </S>
      <S num="6" title="How to Remove Cookies">
        <p className="mb-3">You can clear all Reservely cookies through your browser settings. Doing so will log you out of the dashboard.</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Chrome: Settings → Privacy and security → Clear browsing data</li>
          <li>Firefox: Settings → Privacy &amp; Security → Cookies and Site Data</li>
          <li>Safari: Preferences → Privacy → Manage Website Data</li>
          <li>Edge: Settings → Privacy, search, and services → Clear browsing data</li>
        </ul>
      </S>
      <S num="7" title="Contact">
        <p>Questions about this cookie policy can be directed to{' '}
          <a href="mailto:privacy@reservely.app" className="text-[#0D472B] hover:underline font-medium">privacy@reservely.app</a>.</p>
      </S>
    </div>
  )
}

function CookiesDE() {
  return (
    <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
      <S num="1" title="Was sind Cookies?">
        <p>Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie eine Website besuchen. Sie werden verwendet, um Ihre Sitzung zu speichern, damit Sie sich nicht bei jedem Seitenaufruf erneut anmelden müssen.</p>
      </S>
      <S num="2" title="Von uns verwendete Cookies">
        <p className="mb-4">Reservely verwendet ausschließlich <strong className="text-zinc-800">technisch notwendige Cookies</strong>. Wir verwenden keine Tracking-, Werbe- oder Analyse-Cookies.</p>
        <CookieTable
          headers={['Cookie-Name', 'Zweck', 'Speicherdauer', 'Typ']}
          rows={[
            { name: 'sb-access-token',  purpose: 'Authentifizierungssitzung (Supabase)', duration: '1 Stunde', type: 'Notwendig' },
            { name: 'sb-refresh-token', purpose: 'Sitzungsverlängerung ohne erneutes Anmelden', duration: '30 Tage', type: 'Notwendig' },
          ]}
        />
      </S>
      <S num="3" title="Kein Consent-Banner erforderlich">
        <p>Nach EU-Recht (ePrivacy-Richtlinie und DSGVO) ist ein Consent-Banner nur für nicht notwendige Cookies erforderlich – wie Analyse-, Werbe- oder Tracking-Cookies. Da Reservely ausschließlich technisch notwendige Sitzungscookies verwendet, wird kein Consent-Banner angezeigt.</p>
        <p className="mt-2">Falls wir jemals optionale Analyse-Tools hinzufügen, werden wir diese Richtlinie aktualisieren und vorher einen Einwilligungsmechanismus einführen.</p>
      </S>
      <S num="4" title="Gäste-Buchungsportal">
        <p>Das Gäste-Buchungsportal{' '}
          <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono">/book/[slug]</code>{' '}
          speichert während des Buchungsvorgangs eine temporäre Sitzungskennung im Browser-Local-Storage (kein Cookie). Diese Daten werden nie an Dritte weitergegeben und nach Abschluss der Buchung automatisch gelöscht.</p>
      </S>
      <S num="5" title="Drittanbieter-Dienste">
        <p>Reservely bindet keine Tracking-Skripte von Drittanbietern ein (Google Analytics, Meta Pixel, Hotjar usw.). Der einzige Drittanbieter, der ein Cookie setzen kann, ist{' '}
          <strong className="text-zinc-800">Supabase</strong>, das unser Authentifizierungssystem bereitstellt. Deren Datenschutzrichtlinie:{' '}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0D472B] hover:underline font-medium">supabase.com/privacy</a>.</p>
      </S>
      <S num="6" title="Cookies entfernen">
        <p className="mb-3">Sie können alle Reservely-Cookies über Ihre Browsereinstellungen löschen. Dadurch werden Sie aus dem Dashboard abgemeldet.</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Chrome: Einstellungen → Datenschutz und Sicherheit → Browserdaten löschen</li>
          <li>Firefox: Einstellungen → Datenschutz &amp; Sicherheit → Cookies und Website-Daten</li>
          <li>Safari: Einstellungen → Datenschutz → Website-Daten verwalten</li>
          <li>Edge: Einstellungen → Datenschutz, Suche und Dienste → Browserdaten löschen</li>
        </ul>
      </S>
      <S num="7" title="Kontakt">
        <p>Fragen zu dieser Cookie-Richtlinie richten Sie bitte an{' '}
          <a href="mailto:privacy@reservely.app" className="text-[#0D472B] hover:underline font-medium">privacy@reservely.app</a>.</p>
      </S>
    </div>
  )
}

function S({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-zinc-900 mb-3">
        <span className="w-6 h-6 rounded-full bg-[#0D472B]/10 text-[#0D472B] text-xs font-bold flex items-center justify-center shrink-0">{num}</span>
        {title}
      </h2>
      <div className="pl-8">{children}</div>
    </section>
  )
}

function CookieTable({ headers, rows }: {
  headers: [string, string, string, string]
  rows: { name: string; purpose: string; duration: string; type: string }[]
}) {
  return (
    <div className="rounded-xl border border-zinc-100 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 border-b border-zinc-100">
          <tr>
            {headers.map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map(r => (
            <tr key={r.name}>
              <td className="px-4 py-3 font-mono text-xs text-zinc-700">{r.name}</td>
              <td className="px-4 py-3 text-xs text-zinc-500">{r.purpose}</td>
              <td className="px-4 py-3 text-xs text-zinc-500">{r.duration}</td>
              <td className="px-4 py-3">
                <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded-full">{r.type}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
