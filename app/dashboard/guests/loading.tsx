export default function GuestsLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-5 bg-zinc-200 rounded w-32 animate-pulse" />
      <div className="h-9 bg-zinc-100 rounded-lg w-full animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-zinc-200 animate-pulse">
            <div className="w-8 h-8 bg-zinc-200 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-zinc-200 rounded w-32" />
              <div className="h-2.5 bg-zinc-100 rounded w-48" />
            </div>
            <div className="w-12 h-5 bg-zinc-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
