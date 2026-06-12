export default function DashboardLoading() {
  return (
    <div className="flex h-full">
      {/* Center */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar skeleton */}
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="space-y-1.5 animate-pulse">
            <div className="h-4 bg-zinc-200 rounded w-40" />
            <div className="h-3 bg-zinc-100 rounded w-28" />
          </div>
          <div className="h-7 w-20 bg-zinc-200 rounded-md animate-pulse" />
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Metrics skeleton */}
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-zinc-200 shadow-sm px-4 py-4 animate-pulse"
              >
                <div className="h-3 bg-zinc-200 rounded w-24 mb-3" />
                <div className="h-7 bg-zinc-200 rounded w-12" />
              </div>
            ))}
          </div>

          {/* Timeline skeleton */}
          <div>
            <div className="h-3 bg-zinc-200 rounded w-28 mb-4 animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-zinc-200 animate-pulse"
                >
                  <div className="w-12 h-3 bg-zinc-200 rounded" />
                  <div className="flex-1 h-3 bg-zinc-200 rounded w-36" />
                  <div className="w-8 h-3 bg-zinc-100 rounded" />
                  <div className="w-16 h-5 bg-zinc-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel skeleton */}
      <aside className="w-56 shrink-0 border-l border-zinc-200 bg-white p-4 space-y-3">
        <div className="h-3 bg-zinc-200 rounded w-24 animate-pulse" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-zinc-50 rounded-lg border border-zinc-200 p-3 space-y-2 animate-pulse"
          >
            <div className="h-3 bg-zinc-200 rounded w-20" />
            <div className="h-2.5 bg-zinc-100 rounded w-28" />
            <div className="flex gap-1.5 pt-1">
              <div className="flex-1 h-6 bg-zinc-100 rounded-md" />
              <div className="flex-1 h-6 bg-zinc-100 rounded-md" />
            </div>
          </div>
        ))}
      </aside>
    </div>
  )
}
