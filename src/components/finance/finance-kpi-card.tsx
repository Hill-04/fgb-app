import { type LucideIcon } from 'lucide-react'

type FinanceKpiCardProps = {
  label: string
  value: string | number
  detail: string
  icon: LucideIcon
  tone?: 'green' | 'yellow' | 'red' | 'black'
}

const toneClasses = {
  green: 'from-green-50 to-white text-[var(--verde)] border-green-100',
  yellow: 'from-yellow-50 to-white text-yellow-700 border-yellow-100',
  red: 'from-red-50 to-white text-[var(--red)] border-red-100',
  black: 'from-[var(--gray-l)] to-white text-[var(--black)] border-[var(--border)]',
}

export function FinanceKpiCard({ label, value, detail, icon: Icon, tone = 'black' }: FinanceKpiCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-[30px] border bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[tone]}`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-current opacity-[0.06] blur-2xl transition group-hover:opacity-[0.1]" />
      <div className="relative mb-5 flex items-center justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">{label}</p>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/10 bg-white/75">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="fgb-display relative text-3xl leading-none text-[var(--black)] md:text-4xl">{value}</p>
      <p className="relative mt-3 text-xs font-bold leading-5 text-[var(--gray)]">{detail}</p>
    </div>
  )
}
