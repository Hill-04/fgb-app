export default function Loading() {
  return (
    <div className="space-y-6 pb-10 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-[34px] border border-[var(--border)] bg-white p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-24 rounded-full bg-[var(--gray-l)]" />
          <div className="h-5 w-16 rounded-full bg-[var(--gray-l)]" />
        </div>
        <div className="h-12 w-2/3 rounded-2xl bg-[var(--gray-l)]" />
        <div className="mt-3 h-4 w-1/2 rounded-xl bg-[var(--gray-l)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Pipeline skeleton */}
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-6 space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-9 w-9 rounded-xl bg-[var(--gray-l)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-[var(--gray-l)]" />
                <div className="h-3 w-full rounded bg-[var(--gray-l)]" />
              </div>
            </div>
          ))}
        </div>

        {/* Right column skeleton */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-[var(--border)] h-24" />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-[var(--border)] h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white border border-[var(--border)] h-64" />
            <div className="rounded-2xl bg-white border border-[var(--border)] h-64" />
          </div>
        </div>
      </div>
    </div>
  )
}
