export default function Loading() {
  return (
    <div className="space-y-8 pb-10 animate-pulse">
      <div>
        <div className="h-3 w-32 rounded bg-[var(--gray-l)]" />
        <div className="mt-3 h-12 w-64 rounded-2xl bg-[var(--gray-l)]" />
        <div className="mt-3 h-4 w-2/3 rounded-xl bg-[var(--gray-l)]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[28px] border border-[var(--border)] bg-white p-5 h-32" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[32px] border border-[var(--border)] bg-white h-96" />
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white h-44" />
          <div className="rounded-[28px] border border-[var(--border)] bg-white h-44" />
        </div>
      </div>
    </div>
  )
}
