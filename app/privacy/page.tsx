'use client'

import { LegalLayout } from '@/components/legal/LegalLayout'
import { useLang } from '@/components/i18n/LanguageProvider'
import { legalT } from '@/lib/i18n/translations'

export default function PrivacyPage() {
  const { lang } = useLang()
  const { title, subtitle, updatedAt } = legalT[lang].privacy
  return (
    <LegalLayout title={title} subtitle={subtitle} updatedAt={updatedAt} currentPath="/privacy">
      {lang === 'DE' ? <PrivacyDE /> : <PrivacyEN />}
    </LegalLayout>
  )
}

function PrivacyEN() {
  return (
    <div className="space-y-8">
      <PS num="1" title="Who We Are">
        <p>
          Reservely is a restaurant reservation management platform operating in the EU.
          We are the data controller for personal data processed through our service.
          For data protection enquiries contact us at{' '}
          <a href="mailto:privacy@reservely.app" className="text-[#0D472B] hover:underline font-medium">privacy@reservely.app</a>.
        </p>
      </PS>
      <PS num="2" title="Data We Collect">
        <ul className="space-y-2">
          <Li label="Restaurant operators">name, email address, role within the organisation</Li>
          <Li label="Guests (via reservation)">name, email address, phone number, party size, special requests</Li>
          <Li label="Usage data">login timestamps, reservation actions, table management changes (for security and audit purposes)</Li>
        </ul>
      </PS>
      <PS num="3" title="Legal Basis for Processing">
        <ul className="space-y-2">
          <Li label="Contract performance (Art. 6(1)(b))">providing and operating the reservation management service</Li>
          <Li label="Legitimate interests (Art. 6(1)(f))">service security, fraud prevention, and operational monitoring</Li>
          <Li label="Consent (Art. 6(1)(a))">guest reservation data — collected with explicit consent at booking time</Li>
        </ul>
      </PS>
      <PS num="4" title="How We Use Your Data">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>To provide and operate the reservation management platform</li>
          <li>To send transactional emails (reservation confirmations, rejections, reminders)</li>
          <li>To authenticate users and maintain account security</li>
          <li>To display operational analytics to restaurant operators</li>
        </ul>
      </PS>
      <PS num="5" title="Data Sharing">
        <p className="mb-3">We do not sell personal data. We share data only with these sub-processors:</p>
        <SubProcessorTable rows={[
          { name: 'Supabase Inc.',  purpose: 'Database & authentication',      location: 'Frankfurt, EU'        },
          { name: 'Resend Inc.',    purpose: 'Transactional email delivery',   location: 'USA (SCCs applied)'   },
          { name: 'Vercel Inc.',    purpose: 'Application hosting',            location: 'EU edge nodes'        },
        ]} headers={['Processor', 'Purpose', 'Location']} />
      </PS>
      <PS num="6" title="Data Retention">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Reservation data: retained for 3 years after booking date</li>
          <li>Account data: deleted within 90 days of account closure</li>
          <li>Audit logs: retained for 12 months</li>
          <li>You may request earlier deletion at any time (see §7)</li>
        </ul>
      </PS>
      <PS num="7" title="Your Rights (GDPR)">
        <ul className="space-y-2">
          <Li label="Right of access (Art. 15)">request a copy of your personal data</Li>
          <Li label="Right to rectification (Art. 16)">correct inaccurate or incomplete data</Li>
          <Li label="Right to erasure (Art. 17)">request deletion of your personal data</Li>
          <Li label="Right to restrict processing (Art. 18)">limit how we use your data</Li>
          <Li label="Right to data portability (Art. 20)">receive your data in machine-readable format</Li>
          <Li label="Right to object (Art. 21)">object to processing based on legitimate interests</Li>
        </ul>
        <p className="mt-3">
          To exercise any right, email{' '}
          <a href="mailto:privacy@reservely.app" className="text-[#0D472B] hover:underline font-medium">privacy@reservely.app</a>. We respond within 30 days.
        </p>
      </PS>
      <PS num="8" title="Cookies">
        <p>
          We use only technically necessary cookies for authentication session management.
          We do not use tracking, advertising, or analytics cookies.
          See our{' '}
          <a href="/cookies" className="text-[#0D472B] hover:underline font-medium">Cookie Policy</a>{' '}
          for full details.
        </p>
      </PS>
      <PS num="9" title="Supervisory Authority">
        <p>
          You have the right to lodge a complaint with a data protection supervisory authority.
          In Germany, contact your relevant Landesdatenschutzbehörde — see{' '}
          <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-[#0D472B] hover:underline font-medium">bfdi.bund.de</a>.
          In Austria, contact the Datenschutzbehörde:{' '}
          <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-[#0D472B] hover:underline font-medium">dsb.gv.at</a>.
        </p>
      </PS>
      <PS num="10" title="Changes to This Policy">
        <p>Material changes will be communicated by email to registered restaurant operators at least 14 days before they take effect.</p>
      </PS>
    </div>
  )
}

function PrivacyDE() {
  return (
    <div className="space-y-8">
      <PS num="1" title="Wer wir sind">
        <p>
          Reservely ist eine Restaurantreservierungs-Managementplattform im EU-Raum.
          Wir sind Verantwortlicher für die durch unseren Dienst verarbeiteten personenbezogenen Daten.
          Bei datenschutzrechtlichen Anfragen wenden Sie sich bitte an{' '}
          <a href="mailto:privacy@reservely.app" className="text-[#0D472B] hover:underline font-medium">privacy@reservely.app</a>.
        </p>
      </PS>
      <PS num="2" title="Erhobene Daten">
        <ul className="space-y-2">
          <Li label="Restaurantbetreiber">Name, E-Mail-Adresse, Rolle in der Organisation</Li>
          <Li label="Gäste (über Reservierung)">Name, E-Mail-Adresse, Telefonnummer, Personenanzahl, besondere Wünsche</Li>
          <Li label="Nutzungsdaten">Anmelde-Zeitstempel, Reservierungsaktionen, Tischverwaltungsänderungen (für Sicherheits- und Prüfzwecke)</Li>
        </ul>
      </PS>
      <PS num="3" title="Rechtsgrundlage der Verarbeitung">
        <ul className="space-y-2">
          <Li label="Vertragserfüllung (Art. 6 Abs. 1 lit. b)">Bereitstellung und Betrieb des Reservierungsmanagement-Dienstes</Li>
          <Li label="Berechtigte Interessen (Art. 6 Abs. 1 lit. f)">Dienstsicherheit, Betrugsprävention und Betriebsüberwachung</Li>
          <Li label="Einwilligung (Art. 6 Abs. 1 lit. a)">Gäste-Reservierungsdaten – zum Buchungszeitpunkt mit ausdrücklicher Einwilligung erhoben</Li>
        </ul>
      </PS>
      <PS num="4" title="Verwendung Ihrer Daten">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Bereitstellung und Betrieb der Reservierungsmanagement-Plattform</li>
          <li>Versand transaktionaler E-Mails (Reservierungsbestätigungen, Ablehnungen, Erinnerungen)</li>
          <li>Nutzerauthentifizierung und Kontosicherheit</li>
          <li>Anzeige operativer Analysen für Restaurantbetreiber</li>
        </ul>
      </PS>
      <PS num="5" title="Datenweitergabe">
        <p className="mb-3">Wir verkaufen keine personenbezogenen Daten. Daten werden nur an folgende Auftragsverarbeiter weitergegeben:</p>
        <SubProcessorTable rows={[
          { name: 'Supabase Inc.',  purpose: 'Datenbank & Authentifizierung',     location: 'Frankfurt, EU'             },
          { name: 'Resend Inc.',    purpose: 'Transaktionaler E-Mail-Versand',    location: 'USA (SCCs angewendet)'     },
          { name: 'Vercel Inc.',    purpose: 'Anwendungshosting',                 location: 'EU-Edge-Nodes'             },
        ]} headers={['Auftragsverarbeiter', 'Zweck', 'Standort']} />
      </PS>
      <PS num="6" title="Datenspeicherung">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Reservierungsdaten: 3 Jahre nach dem Buchungsdatum aufbewahrt</li>
          <li>Kontodaten: innerhalb von 90 Tagen nach Kontoschließung gelöscht</li>
          <li>Prüfprotokolle: 12 Monate aufbewahrt</li>
          <li>Sie können jederzeit eine frühere Löschung beantragen (siehe §7)</li>
        </ul>
      </PS>
      <PS num="7" title="Ihre Rechte (DSGVO)">
        <ul className="space-y-2">
          <Li label="Auskunftsrecht (Art. 15)">Kopie Ihrer personenbezogenen Daten anfordern</Li>
          <Li label="Recht auf Berichtigung (Art. 16)">unrichtige oder unvollständige Daten korrigieren</Li>
          <Li label="Recht auf Löschung (Art. 17)">Löschung Ihrer personenbezogenen Daten verlangen</Li>
          <Li label="Recht auf Einschränkung der Verarbeitung (Art. 18)">Einschränkung der Nutzung Ihrer Daten</Li>
          <Li label="Recht auf Datenübertragbarkeit (Art. 20)">Daten in maschinenlesbarem Format erhalten</Li>
          <Li label="Widerspruchsrecht (Art. 21)">Verarbeitung auf Grundlage berechtigter Interessen widersprechen</Li>
        </ul>
        <p className="mt-3">
          Zur Geltendmachung eines Rechts senden Sie eine E-Mail an{' '}
          <a href="mailto:privacy@reservely.app" className="text-[#0D472B] hover:underline font-medium">privacy@reservely.app</a>. Wir antworten innerhalb von 30 Tagen.
        </p>
      </PS>
      <PS num="8" title="Cookies">
        <p>
          Wir verwenden ausschließlich technisch notwendige Cookies für das Authentifizierungs-Sitzungsmanagement.
          Wir verwenden keine Tracking-, Werbe- oder Analyse-Cookies.
          Weitere Details finden Sie in unserer{' '}
          <a href="/cookies" className="text-[#0D472B] hover:underline font-medium">Cookie-Richtlinie</a>.
        </p>
      </PS>
      <PS num="9" title="Aufsichtsbehörde">
        <p>
          Sie haben das Recht, eine Beschwerde bei einer Datenschutz-Aufsichtsbehörde einzureichen.
          In Deutschland wenden Sie sich an Ihre zuständige Landesdatenschutzbehörde – siehe{' '}
          <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-[#0D472B] hover:underline font-medium">bfdi.bund.de</a>.
          In Österreich wenden Sie sich an die Datenschutzbehörde:{' '}
          <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-[#0D472B] hover:underline font-medium">dsb.gv.at</a>.
        </p>
      </PS>
      <PS num="10" title="Änderungen dieser Richtlinie">
        <p>Wesentliche Änderungen werden eingetragenen Restaurantbetreibern per E-Mail mindestens 14 Tage vor Inkrafttreten mitgeteilt.</p>
      </PS>
    </div>
  )
}

function PS({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-zinc-900 mb-3">
        <span className="w-6 h-6 rounded-full bg-[#0D472B]/10 text-[#0D472B] text-xs font-bold flex items-center justify-center shrink-0">{num}</span>
        {title}
      </h2>
      <div className="text-sm text-zinc-600 leading-relaxed pl-8">{children}</div>
    </section>
  )
}

function Li({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 list-none">
      <span className="w-1.5 h-1.5 rounded-full bg-[#0D472B]/40 mt-1.5 shrink-0" />
      <span><strong className="text-zinc-700 font-semibold">{label}:</strong> {children}</span>
    </li>
  )
}

function SubProcessorTable({ rows, headers }: { rows: { name: string; purpose: string; location: string }[]; headers: [string, string, string] }) {
  return (
    <div className="rounded-xl border border-zinc-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 border-b border-zinc-100">
          <tr>
            {headers.map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map(r => (
            <tr key={r.name}>
              <td className="px-4 py-3 text-xs font-medium text-zinc-700">{r.name}</td>
              <td className="px-4 py-3 text-xs text-zinc-500">{r.purpose}</td>
              <td className="px-4 py-3 text-xs text-zinc-500">{r.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
