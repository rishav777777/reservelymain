import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700 mb-8 block">
          ← Back to Reservely
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Terms of Service</h1>
        <p className="text-xs text-zinc-400 mb-10">Last updated: June 2026</p>
        <div className="space-y-8 text-zinc-600">
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">1. Acceptance</h2>
            <p className="text-sm leading-relaxed">By accessing or using Reservely, you agree to be bound by these Terms of Service.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">2. The Service</h2>
            <p className="text-sm leading-relaxed">Reservely is a cloud-based restaurant reservation management platform. Access is granted on a subscription basis following approval of a demo request.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">3. Your Account</h2>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorised access</li>
              <li>You may not share credentials with unauthorised third parties</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">4. Acceptable Use</h2>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li>Do not use the service for any unlawful purpose</li>
              <li>Do not attempt unauthorised access to any part of the service</li>
              <li>Do not use the service to process data you do not have the right to process</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">5. Guest Data Responsibilities</h2>
            <p className="text-sm leading-relaxed">When using Reservely to manage guest reservations, you act as the data controller for your guests' personal data. You are responsible for ensuring appropriate legal basis to process guest data. Reservely acts as a data processor on your behalf. A Data Processing Agreement (DPA) is available on request.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">6. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed">To the maximum extent permitted by law, Reservely's total liability shall not exceed the amount paid by you in the 3 months preceding the claim.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">7. Governing Law</h2>
            <p className="text-sm leading-relaxed">These terms are governed by the laws of Germany. Disputes shall be subject to the exclusive jurisdiction of the courts of Germany.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">8. Contact</h2>
            <p className="text-sm leading-relaxed">For questions about these terms, contact us at <a href="mailto:legal@reservely.app" className="text-zinc-900 underline">legal@reservely.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
