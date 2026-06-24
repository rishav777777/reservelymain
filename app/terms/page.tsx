'use client'

import { LegalLayout } from '@/components/legal/LegalLayout'
import { useLang } from '@/components/i18n/LanguageProvider'
import { legalT } from '@/lib/i18n/translations'

export default function TermsPage() {
  const { lang } = useLang()
  const { title, subtitle, updatedAt } = legalT[lang].terms
  return (
    <LegalLayout title={title} subtitle={subtitle} updatedAt={updatedAt} currentPath="/terms">
      {lang === 'DE' ? <TermsDE /> : <TermsEN />}
    </LegalLayout>
  )
}

function TermsEN() {
  return (
    <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
      <S num="1" title="Acceptance">
        <p>By accessing or using Reservely, you agree to be bound by these Terms of Service and our{' '}
          <a href="/privacy" className="text-[#0D472B] hover:underline font-medium">Privacy Policy</a>.
          If you do not agree, you may not use the service.</p>
      </S>
      <S num="2" title="The Service">
        <p>Reservely is a cloud-based restaurant reservation management platform. Access is granted on a subscription basis. We reserve the right to modify features with reasonable notice.</p>
      </S>
      <S num="3" title="Your Account">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>You are responsible for maintaining the security of your account credentials</li>
          <li>You must notify us immediately of any unauthorised access</li>
          <li>You may not share credentials with unauthorised third parties</li>
          <li>You are responsible for all activity that occurs under your account</li>
        </ul>
      </S>
      <S num="4" title="Acceptable Use">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Do not use the service for any unlawful purpose</li>
          <li>Do not attempt unauthorised access to any part of the service</li>
          <li>Do not interfere with or disrupt the service or servers</li>
          <li>Do not use the service to process data you do not have the right to process</li>
        </ul>
      </S>
      <S num="5" title="Guest Data Responsibilities">
        <p className="mb-2">When using Reservely to manage guest reservations, you act as the <strong className="text-zinc-800">data controller</strong>{' '}
          for your guests' personal data. You are responsible for:</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Ensuring an appropriate legal basis to collect and process guest data</li>
          <li>Displaying your own privacy notice to guests where required</li>
          <li>Responding to guest data subject requests (access, deletion, etc.)</li>
        </ul>
        <p className="mt-2">Reservely acts as a <strong className="text-zinc-800">data processor</strong> on your behalf.
          A Data Processing Agreement (DPA) is available on request from{' '}
          <a href="mailto:legal@reservely.app" className="text-[#0D472B] hover:underline font-medium">legal@reservely.app</a>.</p>
      </S>
      <S num="6" title="Subscriptions & Billing">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Subscription fees are billed monthly in advance</li>
          <li>Cancellation takes effect at the end of the current billing period</li>
          <li>We do not offer refunds for partial months</li>
          <li>We reserve the right to adjust pricing with 30 days written notice</li>
        </ul>
      </S>
      <S num="7" title="Service Availability">
        <p>We aim for 99.5% uptime but do not guarantee uninterrupted availability. Scheduled maintenance will be communicated in advance. We are not liable for outages caused by third-party infrastructure (Supabase, Vercel, Resend).</p>
      </S>
      <S num="8" title="Limitation of Liability">
        <p>To the maximum extent permitted by law, Reservely's total liability to you shall not exceed the total amount paid by you in the 3 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.</p>
      </S>
      <S num="9" title="Intellectual Property">
        <p>All intellectual property in the Reservely platform — including software, design, and branding — remains the exclusive property of Reservely. You receive a limited, non-exclusive licence to use the service during your subscription period.</p>
      </S>
      <S num="10" title="Termination">
        <p>We may suspend or terminate your account for material breach of these terms, non-payment, or if we are required to do so by law. You may terminate your account at any time via the dashboard settings.</p>
      </S>
      <S num="11" title="Governing Law">
        <p>These terms are governed by the laws of Germany. Disputes shall be subject to the exclusive jurisdiction of the courts of München, Germany.</p>
      </S>
      <S num="12" title="Contact">
        <p>For questions about these terms:{' '}
          <a href="mailto:legal@reservely.app" className="text-[#0D472B] hover:underline font-medium">legal@reservely.app</a>.</p>
      </S>
    </div>
  )
}

function TermsDE() {
  return (
    <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
      <S num="1" title="Zustimmung">
        <p>Durch den Zugriff auf oder die Nutzung von Reservely erklären Sie sich mit diesen Nutzungsbedingungen und unserer{' '}
          <a href="/privacy" className="text-[#0D472B] hover:underline font-medium">Datenschutzerklärung</a> einverstanden.
          Wenn Sie nicht einverstanden sind, dürfen Sie den Dienst nicht nutzen.</p>
      </S>
      <S num="2" title="Der Dienst">
        <p>Reservely ist eine cloudbasierte Reservierungsmanagement-Plattform für Restaurants. Der Zugang wird auf Abonnementbasis gewährt. Wir behalten uns das Recht vor, Funktionen mit angemessener Vorankündigung zu ändern.</p>
      </S>
      <S num="3" title="Ihr Konto">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Sie sind für die Sicherheit Ihrer Zugangsdaten verantwortlich</li>
          <li>Sie müssen uns unverzüglich über jeden unbefugten Zugriff informieren</li>
          <li>Sie dürfen Zugangsdaten nicht an Unbefugte weitergeben</li>
          <li>Sie sind für alle Aktivitäten verantwortlich, die unter Ihrem Konto stattfinden</li>
        </ul>
      </S>
      <S num="4" title="Zulässige Nutzung">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Nutzen Sie den Dienst nicht für rechtswidrige Zwecke</li>
          <li>Versuchen Sie nicht, unbefugten Zugang zu Teilen des Dienstes zu erlangen</li>
          <li>Stören oder unterbrechen Sie den Dienst oder die Server nicht</li>
          <li>Verarbeiten Sie keine Daten, zu deren Verarbeitung Sie nicht berechtigt sind</li>
        </ul>
      </S>
      <S num="5" title="Verantwortung für Gastdaten">
        <p className="mb-2">Bei der Nutzung von Reservely für die Verwaltung von Gäste-Reservierungen fungieren Sie als <strong className="text-zinc-800">Verantwortlicher</strong>{' '}
          für die personenbezogenen Daten Ihrer Gäste. Sie sind verantwortlich für:</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Die Sicherstellung einer angemessenen Rechtsgrundlage für die Erhebung und Verarbeitung von Gastdaten</li>
          <li>Die Anzeige eigener Datenschutzhinweise an Gäste, soweit erforderlich</li>
          <li>Die Beantwortung von Auskunftsanfragen der Gäste (Zugang, Löschung usw.)</li>
        </ul>
        <p className="mt-2">Reservely fungiert als <strong className="text-zinc-800">Auftragsverarbeiter</strong> in Ihrem Auftrag.
          Eine Auftragsverarbeitungsvereinbarung (AVV) ist auf Anfrage unter{' '}
          <a href="mailto:legal@reservely.app" className="text-[#0D472B] hover:underline font-medium">legal@reservely.app</a> erhältlich.</p>
      </S>
      <S num="6" title="Abonnements & Abrechnung">
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Abonnementgebühren werden monatlich im Voraus berechnet</li>
          <li>Die Kündigung wird zum Ende des laufenden Abrechnungszeitraums wirksam</li>
          <li>Wir bieten keine Rückerstattungen für anteilige Monate</li>
          <li>Wir behalten uns vor, Preise mit 30 Tagen schriftlicher Vorankündigung anzupassen</li>
        </ul>
      </S>
      <S num="7" title="Dienstverfügbarkeit">
        <p>Wir streben eine Verfügbarkeit von 99,5 % an, garantieren jedoch keine ununterbrochene Verfügbarkeit. Geplante Wartungsarbeiten werden im Voraus angekündigt. Wir haften nicht für Ausfälle, die durch Drittanbieter-Infrastruktur verursacht werden (Supabase, Vercel, Resend).</p>
      </S>
      <S num="8" title="Haftungsbeschränkung">
        <p>Im gesetzlich maximal zulässigen Umfang ist die Gesamthaftung von Reservely Ihnen gegenüber auf den in den 3 Monaten vor dem Anspruch von Ihnen gezahlten Gesamtbetrag beschränkt. Wir haften nicht für indirekte, zufällige oder Folgeschäden.</p>
      </S>
      <S num="9" title="Geistiges Eigentum">
        <p>Alle geistigen Eigentumsrechte an der Reservely-Plattform – einschließlich Software, Design und Markenzeichen – verbleiben ausschließlich beim Eigentümer von Reservely. Sie erhalten eine beschränkte, nicht exklusive Lizenz zur Nutzung des Dienstes während Ihrer Abonnementlaufzeit.</p>
      </S>
      <S num="10" title="Kündigung">
        <p>Wir können Ihr Konto bei wesentlichem Verstoß gegen diese Bedingungen, bei Nichtzahlung oder wenn wir gesetzlich dazu verpflichtet sind, sperren oder kündigen. Sie können Ihr Konto jederzeit über die Dashboard-Einstellungen kündigen.</p>
      </S>
      <S num="11" title="Geltendes Recht">
        <p>Diese Bedingungen unterliegen deutschem Recht. Streitigkeiten unterliegen der ausschließlichen Zuständigkeit der Gerichte in München, Deutschland.</p>
      </S>
      <S num="12" title="Kontakt">
        <p>Bei Fragen zu diesen Nutzungsbedingungen:{' '}
          <a href="mailto:legal@reservely.app" className="text-[#0D472B] hover:underline font-medium">legal@reservely.app</a>.</p>
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
