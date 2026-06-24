import { LegalLayout } from '@/components/legal/LegalLayout'

export default function ImpressumPage() {
  return (
    <LegalLayout
      title="Impressum"
      subtitle="Angaben gemäß § 5 TMG (Deutschland) / § 5 ECG (Österreich)"
      currentPath="/impressum"
    >
      <div className="space-y-8 text-zinc-600">

        <Section title="Anbieter">
          <p className="text-sm leading-relaxed text-zinc-700">
            Reservely GmbH<br />
            Musterstraße 1<br />
            80331 München<br />
            Deutschland
          </p>
        </Section>

        <hr className="border-zinc-100" />

        <Section title="Geschäftsführung">
          <p className="text-sm leading-relaxed text-zinc-700">
            [Vorname Nachname]<br />
            Geschäftsführer
          </p>
        </Section>

        <hr className="border-zinc-100" />

        <Section title="Kontakt">
          <p className="text-sm leading-relaxed text-zinc-700">
            E-Mail:{' '}
            <a href="mailto:hallo@reservely.app" className="text-[#0D472B] hover:underline font-medium">
              hallo@reservely.app
            </a>
          </p>
        </Section>

        <hr className="border-zinc-100" />

        <Section title="Registereintrag">
          <p className="text-sm leading-relaxed text-zinc-700">
            Eingetragen im Handelsregister des Amtsgerichts München<br />
            Registernummer: HRB [XXXXXX]
          </p>
        </Section>

        <hr className="border-zinc-100" />

        <Section title="Umsatzsteuer-ID">
          <p className="text-sm leading-relaxed text-zinc-700">
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
            DE [XXXXXXXXX]
          </p>
        </Section>

        <hr className="border-zinc-100" />

        <Section title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV">
          <p className="text-sm leading-relaxed text-zinc-700">
            [Vorname Nachname]<br />
            Musterstraße 1<br />
            80331 München
          </p>
        </Section>

        <hr className="border-zinc-100" />

        <Section title="Streitschlichtung">
          <p className="text-sm leading-relaxed text-zinc-700">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0D472B] hover:underline font-medium"
            >
              ec.europa.eu/consumers/odr
            </a>
            . Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>
          <p className="text-sm leading-relaxed text-zinc-700 mt-2">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </Section>

        <hr className="border-zinc-100" />

        <Section title="Haftung für Inhalte">
          <p className="text-sm leading-relaxed text-zinc-700">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen.
          </p>
        </Section>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs text-amber-700 font-medium">
            Hinweis: Die mit [Klammern] markierten Felder sind Platzhalter und müssen vor dem Launch
            mit den tatsächlichen Unternehmensdaten ersetzt werden.
          </p>
        </div>

      </div>
    </LegalLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">{title}</h2>
      {children}
    </section>
  )
}
