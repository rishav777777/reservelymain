export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-sm font-bold">R</span>
        </div>
        <h1 className="text-lg font-semibold text-zinc-900 mb-2">Down for maintenance</h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          We're making some improvements. The dashboard will be back shortly.
          Thank you for your patience.
        </p>
        <p className="text-xs text-zinc-400 mt-6">Reservely</p>
      </div>
    </div>
  )
}
