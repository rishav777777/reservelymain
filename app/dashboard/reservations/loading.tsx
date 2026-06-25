export default function ReservationsLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-5 bg-zinc-200 rounded w-40 animate-pulse" />
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 bg-zinc-100 rounded-lg animate-pulse" />)}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-zinc-200 animate-pulse">
            <div className="w-12 h-3 bg-zinc-200 rounded" />
            <div className="w-28 h-3 bg-zinc-200 rounded" />
            <div className="flex-1 h-3 bg-zinc-100 rounded" />
            <div className="w-16 h-5 bg-zinc-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
