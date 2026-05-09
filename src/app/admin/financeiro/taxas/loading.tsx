export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="h-12 w-72 rounded-2xl bg-[var(--gray-l)]" />
          <div className="mt-3 h-4 w-2/3 rounded-xl bg-[var(--gray-l)]" />
        </div>
        <div className="h-11 w-44 rounded-xl bg-[var(--gray-l)]" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[28px] border border-[var(--border)] bg-white p-5 h-28" />
        ))}
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-white h-96" />
    </div>
  )
}
