import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700 mb-8 block">
          ← Back to Reservely
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Privacy Policy</h1>
        <p className="text-xs text-zinc-400 mb-10">Last updated: June 2026</p>
        <div className="space-y-8 text-zinc-600">
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">1. Who We Are</h2>
            <p className="text-sm leading-relaxed">Reservely is a restaurant reservation management platform. We are the data controller for personal data processed through our service. For data protection enquiries contact us at <a href="mailto:privacy@reservely.app" className="text-zinc-900 underline">privacy@reservely.app</a>.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">2. Data We Collect</h2>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li><strong>Restaurant operators:</strong> name, email address, role within the organisation</li>
              <li><strong>Guests (via reservation):</strong> name, email address, phone number, party size, special requests</li>
              <li><strong>Usage data:</strong> login timestamps, reservation actions, table management changes</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">3. Legal Basis for Processing</h2>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li><strong>Contract performance (Art. 6(1)(b)):</strong> providing the reservation management service</li>
              <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> service security and fraud prevention</li>
              <li><strong>Consent (Art. 6(1)(a)):</strong> guest reservation data collected with explicit consent</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">4. How We Use Your Data</h2>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li>To provide and operate the reservation management platform</li>
              <li>To send transactional emails (reservation confirmations, rejections)</li>
              <li>To authenticate users and maintain account security</li>
              <li>To display operational analytics to restaurant operators</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">5. Data Sharing</h2>
            <p className="text-sm leading-relaxed mb-3">We do not sell personal data. We share data only with:</p>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li><strong>Supabase Inc.</strong> — database and authentication (Frankfurt, EU region)</li>
              <li><strong>Resend Inc.</strong> — transactional email delivery</li>
              <li><strong>Vercel Inc.</strong> — application hosting and infrastructure</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">6. Data Retention</h2>
            <p className="text-sm leading-relaxed">Reservation data is retained for 3 years. Account data is deleted within 90 days of account closure. You may request earlier deletion at any time.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">7. Your Rights (GDPR)</h2>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li><strong>Right of access (Art. 15):</strong> request a copy of your personal data</li>
              <li><strong>Right to rectification (Art. 16):</strong> correct inaccurate data</li>
              <li><strong>Right to erasure (Art. 17):</strong> request deletion of your data</li>
              <li><strong>Right to restrict processing (Art. 18):</strong> limit how we use your data</li>
              <li><strong>Right to data portability (Art. 20):</strong> receive data in machine-readable format</li>
              <li><strong>Right to object (Art. 21):</strong> object to processing based on legitimate interests</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">To exercise any right, email <a href="mailto:privacy@reservely.app" className="text-zinc-900 underline">privacy@reservely.app</a>. We respond within 30 days.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">8. Cookies</h2>
            <p className="text-sm leading-relaxed">We use only technically necessary cookies for authentication session management. We do not use tracking, advertising, or analytics cookies.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">9. Supervisory Authority</h2>
            <p className="text-sm leading-relaxed">You have the right to lodge a complaint with a supervisory authority. In Germany, contact the relevant Landesdatenschutzbehörde. See <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline">bfdi.bund.de</a>.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">Material changes will be communicated by email to registered operators.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
